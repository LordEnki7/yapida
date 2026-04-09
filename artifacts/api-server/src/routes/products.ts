import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    businessId: p.businessId,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    category: p.category,
    isAvailable: p.isAvailable,
    createdAt: p.createdAt,
  };
}

router.get("/businesses/:businessId/products", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const businessId = parseInt(raw, 10);
  if (isNaN(businessId)) { res.status(400).json({ error: "Invalid businessId" }); return; }
  const products = await db.select().from(productsTable).where(eq(productsTable.businessId, businessId));
  res.json(products.map(formatProduct));
});

router.post("/businesses/:businessId/products", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raw = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const businessId = parseInt(raw, 10);
  if (isNaN(businessId)) { res.status(400).json({ error: "Invalid businessId" }); return; }
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [product] = await db.insert(productsTable).values({ businessId, ...parsed.data }).returning();
  res.status(201).json(formatProduct(product));
});

router.patch("/businesses/:businessId/products/:productId", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rawBiz = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const rawProd = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const businessId = parseInt(rawBiz, 10);
  const productId = parseInt(rawProd, 10);
  if (isNaN(businessId) || isNaN(productId)) { res.status(400).json({ error: "Invalid params" }); return; }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [product] = await db.update(productsTable).set(parsed.data)
    .where(and(eq(productsTable.id, productId), eq(productsTable.businessId, businessId)))
    .returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/businesses/:businessId/products/:productId", async (req, res): Promise<void> => {
  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rawBiz = Array.isArray(req.params.businessId) ? req.params.businessId[0] : req.params.businessId;
  const rawProd = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const businessId = parseInt(rawBiz, 10);
  const productId = parseInt(rawProd, 10);
  if (isNaN(businessId) || isNaN(productId)) { res.status(400).json({ error: "Invalid params" }); return; }
  await db.delete(productsTable).where(and(eq(productsTable.id, productId), eq(productsTable.businessId, businessId)));
  res.sendStatus(204);
});

export default router;
