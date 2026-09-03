import { Car, Motorbike } from "lucide-react";

import type { VehicleKind } from "@/db/schema";
import { photoUrl, type Photo, type PhotoVariant } from "@/lib/photos";
import { cn } from "@/lib/utils";

type Props = {
  photo?: Photo;
  alt: string;
  /** Desenha o placeholder certo enquanto o anuncio nao tem foto. */
  kind?: VehicleKind;
  /** Tamanho do icone de placeholder quando o anuncio ainda nao tem arquivo. */
  iconClassName?: string;
  className?: string;
  contain?: boolean;
  priority?: boolean;
  /** "thumb" nos cards e miniaturas; "full" na galeria e no lightbox. */
  variant?: PhotoVariant;
};

/**
 * Camada absoluta com a foto do veiculo — ou, enquanto nao houver arquivo no
 * R2, o placeholder de carro do design.
 *
 * E um <img> puro de proposito: as fotos ja sao gravadas redimensionadas no
 * upload e servidas pelo CDN do R2, entao nao ha o que otimizar em runtime
 * (e o otimizador do next/image nao roda no Workers).
 */
export function PhotoFill({
  photo,
  alt,
  kind = "carro",
  iconClassName = "size-14",
  className,
  contain,
  priority,
  variant = "full",
}: Props) {
  const url = photo ? photoUrl(photo, variant) : null;

  if (!url) {
    const Placeholder = kind === "moto" ? Motorbike : Car;
    return (
      <div
        className={cn("absolute inset-0 grid place-items-center", className)}
        aria-hidden="true"
      >
        <Placeholder className={cn("stroke-[1.25] text-zinc-400", iconClassName)} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={photo?.width ?? undefined}
      height={photo?.height ?? undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn(
        "absolute inset-0 size-full",
        contain ? "object-contain" : "object-cover",
        className,
      )}
    />
  );
}
