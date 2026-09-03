import { asc } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "./index";
import { vehicleImages, vehicles } from "./schema";
import type { Vehicle } from "@/lib/vehicle";

/**
 * Carrega a vitrine inteira.
 *
 * Sao ~10 anuncios: duas consultas simples e costurar em memoria sai mais
 * barato (e mais legivel) que um join com agregacao no D1. A pagina entrega
 * a lista completa e o filtro roda no cliente.
 */
export const listVehicles = cache(async (): Promise<Vehicle[]> => {
  const db = await getDb();

  const [rows, images] = await Promise.all([
    db.select().from(vehicles).orderBy(asc(vehicles.position), asc(vehicles.id)),
    db
      .select()
      .from(vehicleImages)
      .orderBy(asc(vehicleImages.vehicleId), asc(vehicleImages.position)),
  ]);

  const byVehicle = new Map<number, Vehicle["photos"]>();
  for (const image of images) {
    const list = byVehicle.get(image.vehicleId) ?? [];
    list.push({
      key: image.key,
      label: image.label,
      width: image.width,
      height: image.height,
    });
    byVehicle.set(image.vehicleId, list);
  }

  return rows.map((row) => ({
    ...row,
    features: Array.isArray(row.features) ? row.features : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    photos: byVehicle.get(row.id) ?? [],
  }));
});

export async function getVehicleBySlug(slug: string) {
  const all = await listVehicles();
  return {
    vehicle: all.find((v) => v.slug === slug) ?? null,
    all,
  };
}
