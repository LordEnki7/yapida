import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, driversTable, businessesTable, ordersTable, orderItemsTable, productsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/platform", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [users, drivers, businesses, orders] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(driversTable),
    db.select().from(businessesTable),
    db.select().from(ordersTable),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);

  res.json({
    totalUsers: users.filter(u => u.role === "customer").length,
    totalDrivers: drivers.length,
    totalBusinesses: businesses.length,
    totalOrders: orders.length,
    ordersToday: todayOrders.length,
    revenueToday: todayOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.commission, 0),
    revenueWeek: weekOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.commission, 0),
    activeDrivers: drivers.filter(d => d.isOnline).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    avgDeliveryTime: 25,
  });
});

router.get("/stats/business", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.userId, sessionUserId));
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.businessId, business.id));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
  const delivered = orders.filter(o => o.status === "delivered");

  const allItems = await db.select().from(orderItemsTable);
  const bizOrderIds = new Set(orders.map(o => o.id));
  const bizItems = allItems.filter(i => bizOrderIds.has(i.orderId));

  const productCounts: Record<string, { productName: string; totalSold: number; revenue: number; productId: number }> = {};
  for (const item of bizItems) {
    const key = item.productName;
    if (!productCounts[key]) {
      productCounts[key] = { productName: item.productName, totalSold: 0, revenue: 0, productId: item.productId ?? 0 };
    }
    productCounts[key].totalSold += item.quantity;
    productCounts[key].revenue += item.price * item.quantity;
  }

  const topProducts = Object.values(productCounts).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

  res.json({
    totalOrders: orders.length,
    ordersToday: todayOrders.length,
    ordersWeek: weekOrders.length,
    revenueToday: todayOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0),
    revenueWeek: weekOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0),
    revenueTotal: delivered.reduce((s, o) => s + o.totalAmount, 0),
    avgRating: business.rating,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    topProducts,
  });
});

router.get("/stats/driver", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, sessionUserId));
  if (!driver) { res.status(404).json({ error: "Driver not found" }); return; }

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.driverId, driver.id));
  const delivered = orders.filter(o => o.status === "delivered");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

  const todayDeliveries = delivered.filter(o => new Date(o.createdAt) >= today);
  const weekDeliveries = delivered.filter(o => new Date(o.createdAt) >= weekAgo);

  const nextBonusAt = Math.ceil((driver.totalDeliveries + 1) / 10) * 10;
  const bonusProgress = ((driver.totalDeliveries % 10) / 10) * 100;

  res.json({
    deliveriesToday: todayDeliveries.length,
    deliveriesWeek: weekDeliveries.length,
    deliveriesTotal: driver.totalDeliveries,
    earningsToday: todayDeliveries.reduce((s, o) => s + o.driverEarnings, 0),
    earningsWeek: weekDeliveries.reduce((s, o) => s + o.driverEarnings, 0),
    earningsTotal: delivered.reduce((s, o) => s + o.driverEarnings, 0),
    avgRating: driver.rating,
    currentStreak: driver.totalDeliveries % 10,
    nextBonusAt,
    bonusProgress,
  });
});

export default router;
