#!/usr/bin/env bash
# =============================================================
#  YaPide pre-deploy validation script
#  Run before pushing to GitHub or triggering a Dokploy deploy.
#  Usage: bash scripts/validate.sh
# =============================================================

set -uo pipefail

API="http://localhost:8080"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}  ✗ $1${NC}"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}  → $1${NC}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║      YaPide Validation Suite         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. TypeScript compile check (frontend) ──────────────────
echo "[ 1/4 ] Frontend TypeScript check"
if pnpm --filter @workspace/que-lo-que exec tsc --noEmit --skipLibCheck 2>&1 | grep -v "TS6306" | grep -q "error TS"; then
  fail "Frontend has TypeScript errors — fix before deploying"
else
  ok "Frontend TypeScript check passed"
fi

# ── 2. API server health ─────────────────────────────────────
echo ""
echo "[ 2/4 ] API server health"

# Simple reachability test first
HEALTH_STATUS=$(curl -s -o /tmp/health_body.json -w "%{http_code}" "$API/api/healthz" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  ok "API server is up (HTTP 200)"
  if grep -q '"db":"ok"' /tmp/health_body.json 2>/dev/null; then
    ok "Database connection healthy"
  else
    fail "Database check failed — check DATABASE_URL"
  fi
elif [ "$HEALTH_STATUS" = "000" ]; then
  fail "API server not reachable at $API — is it running?"
  info "Start it: pnpm --filter @workspace/api-server run dev"
else
  fail "API health check returned HTTP $HEALTH_STATUS"
fi

# ── 3. Key API routes ────────────────────────────────────────
echo ""
echo "[ 3/4 ] Key API routes"

check_route() {
  local method="$1"
  local path="$2"
  local label="$3"
  local data="${4:-}"
  local expected="$5"

  local status
  if [ -n "$data" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" -d "$data" "$API$path" 2>/dev/null)
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API$path" 2>/dev/null)
  fi
  status="${status:-000}"

  if [ "$status" = "$expected" ]; then
    ok "$label (HTTP $status)"
  else
    fail "$label — got HTTP $status, expected $expected"
  fi
}

info "Seeding demo data..."
SEED_BODY=$(curl -s -X POST "$API/api/demo/seed" 2>/dev/null || echo "{}")
if echo "$SEED_BODY" | grep -q '"success":true'; then
  ok "Demo data seeded"
else
  fail "Demo seed failed: $SEED_BODY"
fi

check_route "POST" "/api/demo/login?role=customer" "Demo customer login"  "" "200"
check_route "POST" "/api/demo/login?role=driver"   "Demo driver login"    "" "200"
check_route "POST" "/api/demo/login?role=business" "Demo business login"  "" "200"
check_route "GET"  "/api/businesses"               "List businesses"      "" "200"
check_route "GET"  "/api/auth/me"                  "Auth guard (unauthed)" "" "401"
check_route "GET"  "/api/nonexistent-route-xyz"    "404 handler"          "" "404"

# ── 4. Frontend build ────────────────────────────────────────
echo ""
echo "[ 4/4 ] Frontend build (production mode)"
if pnpm --filter @workspace/que-lo-que run build 2>&1 | tail -3 | grep -q "built in"; then
  ok "Frontend production build succeeded"
else
  fail "Frontend production build failed"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
TOTAL=$((PASS+FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  ALL $TOTAL CHECKS PASSED ✓  Safe to deploy!${NC}"
  echo "════════════════════════════════════════"
  echo ""
  echo "  Push to GitHub:"
  echo "  GIT_ASKPASS='' git push \"https://\$GITHUB_TOKEN@github.com/LordEnki7/yapida.git\" HEAD:main"
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}  $FAIL/$TOTAL CHECKS FAILED — DO NOT DEPLOY${NC}"
  echo "════════════════════════════════════════"
  echo ""
  exit 1
fi
