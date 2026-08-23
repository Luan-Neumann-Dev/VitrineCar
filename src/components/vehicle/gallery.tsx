"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState, type UIEvent } from "react";

import { PhotoFill } from "@/components/photo-fill";
import { PhotoLightbox } from "@/components/vehicle/photo-lightbox";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Os dois layouts do design convivem no DOM e sao trocados por CSS, nao por
 * medicao de largura em JS: assim nao ha salto entre o HTML do servidor e a
 * hidratacao. Sao no maximo ~10 miniaturas, entao o custo e irrelevante.
 */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = photos.length;
  const current = photos[index];

  const step = useCallback(
    (direction: 1 | -1) => {
      if (!total) return;
      setIndex((i) => (i + direction + total) % total);
    },
    [total],
  );

  const onStripScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const next = Math.round(el.scrollLeft / (el.clientWidth + 8));
    if (next !== index) setIndex(Math.max(0, Math.min(next, total - 1)));
  };

  return (
    <>
      {/* Desktop: foto principal + tira de miniaturas */}
      <div
        role="group"
        tabIndex={0}
        aria-label="Galeria de fotos do veículo. Use as setas do teclado para navegar e Enter para ampliar."
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
          if (event.key === "Enter") { event.preventDefault(); setLightbox(true); }
        }}
        className="hidden flex-col gap-2.5 rounded-lg lg:flex"
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-lg border bg-muted">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Ampliar foto em tela cheia"
            className="absolute inset-0 flex size-full cursor-zoom-in flex-col items-center justify-center gap-3"
          >
            <PhotoFill
              photo={current}
              alt={`${title} — ${current?.label ?? "sem fotos"}`}
              iconClassName="size-22"
              priority
            />
            {!current?.key && (
              <span className="relative text-[13px] tracking-wide text-muted-foreground">
                {current?.label ?? "Sem fotos"}
              </span>
            )}
          </button>

          {total > 1 && (
            <>
              <StepButton side="left" onClick={() => step(-1)} />
              <StepButton side="right" onClick={() => step(1)} />
            </>
          )}

          <span
            aria-live="polite"
            className="absolute right-3 bottom-3 inline-flex h-6.5 items-center rounded-md border bg-background/92 px-2.5 text-xs font-medium tabular-nums"
          >
            {total ? `${index + 1}/${total}` : "0/0"}
          </span>
        </div>

        {total > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1} de ${total}: ${photo.label}`}
                aria-current={i === index || undefined}
                className={cn(
                  "relative aspect-4/3 w-[98px] shrink-0 overflow-hidden rounded-md border bg-muted transition-opacity",
                  i === index
                    ? "border-zinc-900 ring-2 ring-zinc-900/12"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <PhotoFill photo={photo} alt={photo.label} variant="thumb" iconClassName="size-6.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: tira com scroll-snap e indicadores */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <div
          onScroll={onStripScroll}
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-lg"
        >
          {(total ? photos : [undefined]).map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setIndex(i); setLightbox(true); }}
              aria-label={photo ? `Ampliar foto ${i + 1} de ${total}: ${photo.label}` : "Sem fotos"}
              className="relative flex aspect-4/3 shrink-0 basis-full cursor-zoom-in snap-center flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border bg-muted"
            >
              <PhotoFill photo={photo} alt={photo?.label ?? title} iconClassName="size-16" />
              {!photo?.key && (
                <span className="relative text-[12.5px] text-muted-foreground">
                  {photo?.label ?? "Sem fotos"}
                </span>
              )}
            </button>
          ))}
        </div>

        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4.5 bg-zinc-900" : "w-1.5 bg-zinc-200",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <PhotoLightbox
        photos={photos}
        index={index}
        title={title}
        open={lightbox}
        onOpenChange={setLightbox}
        onStep={step}
      />
    </>
  );
}

function StepButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Próxima foto"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/92 shadow-xs transition-colors hover:bg-background",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-4.5 stroke-[1.75]" aria-hidden="true" />
    </button>
  );
}
