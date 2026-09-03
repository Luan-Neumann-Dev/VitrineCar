"use client";

import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useCallback, useState, type UIEvent } from "react";

import { PhotoFill } from "@/components/photo-fill";
import { PhotoLightbox } from "@/components/vehicle/photo-lightbox";
import type { VehicleKind } from "@/db/schema";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Os dois layouts do design convivem no DOM e sao trocados por CSS, nao por
 * medicao de largura em JS: assim nao ha salto entre o HTML do servidor e a
 * hidratacao. Sao no maximo ~10 miniaturas, entao o custo e irrelevante.
 */
export function Gallery({
  photos,
  kind,
  title,
}: {
  photos: Photo[];
  kind: VehicleKind;
  title: string;
}) {
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

  const open = (at: number) => {
    if (!total) return;
    setIndex(at);
    setLightbox(true);
  };

  // Slides ocupam a largura inteira da tira, sem espaco entre eles: e a
  // divisao por essa largura que diz em qual foto a rolagem parou.
  const onStripScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const next = Math.round(el.scrollLeft / el.clientWidth);
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
          if (event.key === "Enter") { event.preventDefault(); open(index); }
        }}
        className="hidden flex-col gap-2.5 rounded-lg lg:flex"
      >
        <div className="relative aspect-4/3 overflow-hidden rounded-lg border bg-muted">
          <button
            type="button"
            onClick={() => open(index)}
            aria-label="Ampliar foto em tela cheia"
            className="absolute inset-0 flex size-full cursor-zoom-in flex-col items-center justify-center gap-3"
          >
            <PhotoFill
              photo={current}
              alt={`${title} — ${current?.label ?? "sem fotos"}`}
              kind={kind}
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
                <PhotoFill
                  photo={photo}
                  alt={photo.label}
                  kind={kind}
                  variant="thumb"
                  iconClassName="size-6.5"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/*
        Mobile: a tira sangra até as bordas da tela (-mx-5 anula o padding da
        página). São ~40px a mais de largura e um terço a mais de área — a foto
        do carro é o conteúdo principal da página, não uma ilustração.
      */}
      <div className="-mx-5 flex flex-col gap-3 lg:hidden">
        <div className="relative">
          <div
            onScroll={onStripScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {(total ? photos : [undefined]).map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => open(i)}
                aria-label={
                  photo ? `Ampliar foto ${i + 1} de ${total}: ${photo.label}` : "Sem fotos"
                }
                className="relative flex aspect-4/3 w-full shrink-0 snap-center flex-col items-center justify-center gap-2.5 bg-muted"
              >
                <PhotoFill
                  photo={photo}
                  alt={photo?.label ?? title}
                  kind={kind}
                  iconClassName="size-16"
                />
                {!photo?.key && (
                  <span className="relative text-[12.5px] text-muted-foreground">
                    {photo?.label ?? "Sem fotos"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {total > 0 && (
            <span
              aria-live="polite"
              className="pointer-events-none absolute right-4 bottom-3 inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-950/65 px-2.5 text-xs font-medium tabular-nums text-zinc-50 backdrop-blur-xs"
            >
              <Expand className="size-3.5 stroke-[1.75]" aria-hidden="true" />
              {index + 1}/{total}
            </span>
          )}
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
        kind={kind}
        open={lightbox}
        onOpenChange={setLightbox}
        onIndexChange={setIndex}
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
