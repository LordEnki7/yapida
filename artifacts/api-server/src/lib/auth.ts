import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "qlq-salt-2024").digest("hex");
}

export async function getUserFromSession(req: Request) {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, sessionUserId));
  return user || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sessionUserId = (req.session as any)?.userId;
    if (!sessionUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, sessionUserId));
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as any).currentUser = user;
    next();
  };
}
