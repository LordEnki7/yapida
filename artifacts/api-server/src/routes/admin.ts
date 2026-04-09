import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, driversTable, businessesTable, ordersTable } from "@workspace/db";
import { AdminListUsersQueryParams, AdminBanUserBody, AdminLockDriverBody } from "@workspace/api-zod";

const router: IRouter = Router();

function isAdmin(req: any): boolean {
  return !!(req.session as any)?.userId;
}

router.get("/admin/users", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const params = AdminListUsersQueryParams.safeParse(req.query);
  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  if (params.success && params.data.role) {
    users = users.filter(u => u.role === params.data.role);
  }
  res.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, isBanned: u.isBanned, createdAt: u.createdAt,
  })));
});

router.post("/admin/users/:userId/ban", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid userId" }); return; }
  const parsed = AdminBanUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.update(usersTable).set({ isBanned: parsed.data.isBanned }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.get("/admin/drivers", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const drivers = await db.select().from(driversTable).orderBy(desc(driversTable.createdAt));
  const result = await Promise.all(drivers.map(async (d) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, d.userId));
    return {
      id: d.id,
      userId: d.userId,
      isOnline: d.isOnline,
      isLocked: d.isLocked,
      rating: d.rating,
      acceptanceRate: d.acceptanceRate,
      cashBalance: d.cashBalance,
      walletBalance: d.walletBalance,
      totalDeliveries: d.totalDeliveries,
      user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, isBanned: user.isBanned, createdAt: user.createdAt } : null,
    };
  }));
  res.json(result);
});

router.post("/admin/drivers/:driverId/lock", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raw = Array.isArray(req.params.driverId) ? req.params.driverId[0] : req.params.driverId;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid driverId" }); return; }
  const parsed = AdminLockDriverBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.update(driversTable).set({ isLocked: parsed.data.isLocked, isOnline: parsed.data.isLocked ? false : undefined }).where(eq(driversTable.id, id));
  res.json({ success: true });
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => ({
    id: o.id, customerId: o.customerId, businessId: o.businessId, driverId: o.driverId, status: o.status,
    totalAmount: o.totalAmount, deliveryFee: o.deliveryFee, commission: o.commission, driverEarnings: o.driverEarnings,
    paymentMethod: o.paymentMethod, isPaid: o.isPaid, deliveryAddress: o.deliveryAddress, notes: o.notes,
    customerRating: o.customerRating, driverRating: o.driverRating, businessRating: o.businessRating, createdAt: o.createdAt, items: [],
  })));
});

router.get("/admin/businesses", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const businesses = await db.select().from(businessesTable).orderBy(desc(businessesTable.createdAt));
  res.json(businesses.map(b => ({
    id: b.id, userId: b.userId, name: b.name, category: b.category, description: b.description,
    address: b.address, phone: b.phone, imageUrl: b.imageUrl, lat: b.lat, lng: b.lng,
    isActive: b.isActive, rating: b.rating, totalOrders: b.totalOrders, createdAt: b.createdAt,
  })));
});

router.post("/admin/businesses/:businessId/toggle", async (req, res): Promise<void> => {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raw = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid businessId" }); return; }
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  await db.update(businessesTable).set({ isActive: !biz.isActive }).where(eq(businessesTable.id, id));
  res.json({ success: true });
});

export default router;
