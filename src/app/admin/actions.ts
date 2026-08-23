"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { vehicleImages, vehicles, type VehicleStatus } from "@/db/schema";
import { login, logout, requireSession } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { objectKey, type Photo } from "@/lib/photos";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export type VehicleDraft = {
  id: number | null;
  brand: string;
  model: string;
  version: string;
  yearFab: number;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  doors: number;
  engine: string;
  plateEnd: string;
  ipvaPaid: boolean;
  oneOwner: boolean;
  inspection: boolean;
  status: VehicleStatus;
  features: string[];
  description: string;
  photos: Photo[];
};

/** Remove do bucket as duas variantes de cada foto que saiu do anuncio. */
async function deletePhotos(keys: string[]) {
  if (!keys.length) return;
  const { env } = await getCloudflareContext({ async: true });
  await env.PHOTOS.delete(
    keys.flatMap((key) => [objectKey(key, "full"), objectKey(key, "thumb")]),
  );
}

/**
 * Garante slug unico. O slug e o endereco publico do anuncio, entao dois
 * carros iguais (mesmo modelo e ano) nao podem brigar pela mesma URL.
 */
async function uniqueSlug(base: string, ignoreId: number | null) {
  const db = await getDb();
  const taken = new Set(
    (await db.select({ slug: vehicles.slug, id: vehicles.id }).from(vehicles))
      .filter((row) => row.id !== ignoreId)
      .map((row) => row.slug),
  );

  let slug = base || "anuncio";
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  return slug;
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") || "");
  if (!password.trim()) return { ok: false, error: "Digite a senha para entrar." };

  const result = await login(password);
  if (!result.ok) return result;

  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAction() {
  await logout();
  revalidatePath("/", "layout");
}

export async function saveVehicleAction(draft: VehicleDraft): Promise<ActionResult> {
  await requireSession();

  if (!draft.brand.trim() || !draft.model.trim()) {
    return { ok: false, error: "Informe pelo menos marca e modelo." };
  }

  const db = await getDb();
  const slug = await uniqueSlug(
    slugify([draft.brand, draft.model, draft.version, draft.year]),
    draft.id,
  );

  const values = {
    slug,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    version: draft.version.trim(),
    yearFab: draft.yearFab,
    year: draft.year,
    price: draft.price,
    mileage: draft.mileage,
    transmission: draft.transmission,
    fuel: draft.fuel,
    color: draft.color.trim(),
    doors: draft.doors,
    engine: draft.engine.trim(),
    plateEnd: draft.plateEnd.trim(),
    ipvaPaid: draft.ipvaPaid,
    oneOwner: draft.oneOwner,
    inspection: draft.inspection,
    status: draft.status,
    features: draft.features,
    description: draft.description.trim(),
    updatedAt: Math.floor(Date.now() / 1000),
  };

  let id = draft.id;

  if (id == null) {
    // Anuncio novo entra no topo da vitrine.
    const [{ min }] = await db
      .select({ min: sql<number | null>`min(${vehicles.position})` })
      .from(vehicles);

    const [created] = await db
      .insert(vehicles)
      .values({ ...values, position: (min ?? 0) - 1 })
      .returning({ id: vehicles.id });
    id = created.id;
  } else {
    await db.update(vehicles).set(values).where(eq(vehicles.id, id));
  }

  const previous = await db
    .select({ key: vehicleImages.key })
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id));

  const kept = new Set(draft.photos.map((p) => p.key).filter(Boolean));
  const orphans = previous
    .map((row) => row.key)
    .filter((key): key is string => Boolean(key) && !kept.has(key));

  // As linhas sao reescritas por inteiro: com no maximo ~12 fotos por anuncio
  // isso e mais simples e mais seguro do que reconciliar posicao a posicao.
  await db.delete(vehicleImages).where(eq(vehicleImages.vehicleId, id));
  if (draft.photos.length) {
    await db.insert(vehicleImages).values(
      draft.photos.map((photo, position) => ({
        vehicleId: id,
        key: photo.key,
        label: photo.label,
        width: photo.width,
        height: photo.height,
        position,
      })),
    );
  }

  await deletePhotos(orphans);

  revalidatePath("/", "layout");
  return { ok: true, message: "Anúncio salvo" };
}

export async function deleteVehicleAction(id: number): Promise<ActionResult> {
  await requireSession();

  const db = await getDb();
  const images = await db
    .select({ key: vehicleImages.key })
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id));

  await db.delete(vehicles).where(eq(vehicles.id, id));
  await deletePhotos(images.map((i) => i.key).filter((k): k is string => Boolean(k)));

  revalidatePath("/", "layout");
  return { ok: true, message: "Anúncio excluído" };
}

export async function setStatusAction(
  id: number,
  status: VehicleStatus,
): Promise<ActionResult> {
  await requireSession();
  const db = await getDb();
  await db.update(vehicles).set({ status }).where(eq(vehicles.id, id));
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Troca a posicao com o vizinho. Renumeramos a lista inteira antes de trocar
 * porque o seed pode ter posicoes com buracos.
 */
export async function moveVehicleAction(
  id: number,
  direction: -1 | 1,
): Promise<ActionResult> {
  await requireSession();

  const db = await getDb();
  const rows = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .orderBy(asc(vehicles.position), asc(vehicles.id));

  const index = rows.findIndex((row) => row.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.length) return { ok: true };

  [rows[index], rows[target]] = [rows[target], rows[index]];

  for (const [position, row] of rows.entries()) {
    await db.update(vehicles).set({ position }).where(eq(vehicles.id, row.id));
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function duplicateVehicleAction(id: number): Promise<ActionResult> {
  await requireSession();

  const db = await getDb();
  const [original] = await db.select().from(vehicles).where(eq(vehicles.id, id));
  if (!original) return { ok: false, error: "Anúncio não encontrado." };

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, id))
    .orderBy(asc(vehicleImages.position));

  const slug = await uniqueSlug(`${original.slug}-copia`, null);
  const { id: _drop, ...rest } = original;

  const [copy] = await db
    .insert(vehicles)
    .values({ ...rest, slug, status: "disponivel", position: original.position })
    .returning({ id: vehicles.id });

  if (images.length) {
    // A copia aponta para os mesmos objetos no R2: sao imutaveis e o mesmo
    // arquivo servindo dois anuncios nao custa nada.
    await db.insert(vehicleImages).values(
      images.map(({ id: _imageId, vehicleId: _vehicleId, ...image }) => ({
        ...image,
        vehicleId: copy.id,
      })),
    );
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Anúncio duplicado" };
}

/*
 * Nao existe aqui uma acao de "restaurar exemplos".
 *
 * Toda funcao exportada deste arquivo vira um endpoint acessivel, entao uma
 * acao que apaga o catalogo inteiro nao pode ficar de reserva "por precaucao":
 * ela so deveria existir enquanto houvesse um botao para ela. Para recarregar
 * os exemplos em desenvolvimento, use `pnpm db:reset:local`.
 */
