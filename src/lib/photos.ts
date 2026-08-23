import { site } from "./site";

export type Photo = {
  /**
   * Chave base no R2, sem variante nem extensao
   * (ex.: "fotos/2f9c1a"). Nula enquanto o anuncio so tem a legenda.
   */
  key: string | null;
  label: string;
  width: number | null;
  height: number | null;
};

/** Cada foto e gravada em dois tamanhos no upload. */
export type PhotoVariant = "thumb" | "full";

export const VARIANT_WIDTH: Record<PhotoVariant, number> = {
  thumb: 640,
  full: 1600,
};

export const objectKey = (key: string, variant: PhotoVariant) =>
  `${key}-${variant}.webp`;

/**
 * URL da foto para usar em <img>.
 *
 * Com NEXT_PUBLIC_PHOTOS_BASE_URL configurado, aponta direto para o dominio do
 * bucket e o CDN da Cloudflare serve sem passar pelo Worker. Sem ele, cai no
 * caminho relativo /fotos, servido pelo binding — assim o site ja funciona
 * antes de existir dominio proprio, em vez de mostrar placeholder para uma
 * foto que foi enviada.
 *
 * O caminho reserva e relativo de proposito: assim uma foto nunca depende de
 * NEXT_PUBLIC_SITE_URL estar correta para aparecer.
 */
export function photoUrl(
  photo: Photo,
  variant: PhotoVariant = "full",
): string | null {
  if (!photo.key) return null;
  const object = objectKey(photo.key, variant);
  const base = site.photosBaseUrl.replace(/\/$/, "");
  return base ? `${base}/${object}` : `/fotos/${object}`;
}

/**
 * Mesma foto, sempre com dominio. E o formato que o JSON-LD e a previa de
 * link do WhatsApp exigem — os dois rejeitam caminho relativo.
 */
export function absolutePhotoUrl(
  photo: Photo,
  variant: PhotoVariant = "full",
): string | null {
  const url = photoUrl(photo, variant);
  if (!url) return null;
  return url.startsWith("/") ? `${site.url.replace(/\/$/, "")}${url}` : url;
}
