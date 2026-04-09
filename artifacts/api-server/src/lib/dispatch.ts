import { db, driversTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateETA(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return (distanceKm / avgSpeedKmh) * 60;
}

function scoreDriver(driver: any, pickupLat: number, pickupLng: number) {
  const driverLat = driver.currentLat ?? 18.4861;
  const driverLng = driver.currentLng ?? -69.9312;
  const distance = getDistance(driverLat, driverLng, pickupLat, pickupLng);
  const eta = estimateETA(distance);
  const score =
    0.4 * distance +
    0.3 * eta -
    0.2 * (driver.rating || 5.0) -
    0.1 * (driver.acceptanceRate || 1.0);
  return { driver, score, distance, eta };
}

export async function findNearbyDrivers(pickupLat: number, pickupLng: number, radiusKm = 10) {
  const onlineDrivers = await db
    .select()
    .from(driversTable)
    .where(and(eq(driversTable.isOnline, true), eq(driversTable.isLocked, false)));

  const scored = onlineDrivers
    .filter((d) => {
      const dLat = d.currentLat ?? 18.4861;
      const dLng = d.currentLng ?? -69.9312;
      return getDistance(dLat, dLng, pickupLat, pickupLng) < radiusKm;
    })
    .map((d) => scoreDriver(d, pickupLat, pickupLng))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return scored;
}

export const DELIVERY_BASE_FEE = 100;
export const DELIVERY_FEE_PER_KM = 25;
export const COMMISSION_RATE = 0.15;
export const DRIVER_EARNINGS_RATE = 0.75;
export const CASH_LIMIT = 10000;

export function calculateFees(totalAmount: number, distanceKm = 3) {
  const deliveryFee = DELIVERY_BASE_FEE + DELIVERY_FEE_PER_KM * distanceKm;
  const commission = totalAmount * COMMISSION_RATE;
  const driverEarnings = deliveryFee * DRIVER_EARNINGS_RATE;
  return { deliveryFee, commission, driverEarnings };
}
