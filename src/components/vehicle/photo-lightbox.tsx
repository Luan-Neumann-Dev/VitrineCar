"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, type UIEvent } from "react";

import { PhotoFill } from "@/components/photo-fill";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { VehicleKind } from "@/db/schema";
import type { Photo } from "@/lib/photos";

type Props = {
  photos: Photo[];
  index: number;
  title: string;
  kind: VehicleKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
};

/**
 * Foto em tela cheia.
 *
 * As fotos sao uma tira com scroll-snap, e nao uma imagem trocada por estado:
 * no celular, arrastar e como se navega uma galeria, e as setas laterais
 * (que no desktop sao o caminho natural) roubavam metade da largura da tela.
 * Aqui elas flutuam por cima da imagem e somem nas telas estreitas.
 */
export function PhotoLightbox({
  photos,
  index,
  title,
  kind,
  open,
  onOpenChange,
  onIndexChange,
}: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const total = photos.length;

  const goTo = (target: number, smooth = true) => {
    const el = stripRef.current;
    if (!el || !total) return;
    const next = ((target % total) + total) % total;
    el.scrollTo({
      left: next * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  /**
   * O passo parte da rolagem real, e nao do `index` do estado: segurar a seta
   * dispara varios cliques antes de o primeiro evento de scroll chegar, e com
   * o indice defasado todos eles mirariam a mesma foto.
   */
  const step = (direction: 1 | -1) => {
    const el = stripRef.current;
    if (!el || !total) return;
    goTo(Math.round(el.scrollLeft / el.clientWidth) + direction);
  };

  // Abrir posiciona na foto que o visitante tocou, sem animacao de rolagem.
  useEffect(() => {
    if (open) goTo(index, false);
    // Roda so na abertura: depois disso quem manda na posicao e a rolagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index && next >= 0 && next < total) onIndexChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
        // O Dialog do shadcn entra com zoom; numa peca que ocupa a tela inteira
        // isso escala o viewport todo. O design pede so o fade.
        className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-zinc-950/95 p-0 text-zinc-50 ring-0 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
          <DialogTitle className="truncate text-[13.5px] font-normal text-zinc-50/70">
            {title}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[13.5px] tabular-nums text-zinc-50/70">
              {total ? `${index + 1}/${total}` : "0/0"}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar galeria"
              className="flex size-9 items-center justify-center rounded-md border border-zinc-50/20 transition-colors hover:bg-zinc-50/10"
            >
              <X className="size-4 stroke-[1.75]" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={stripRef}
            onScroll={onScroll}
            className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {photos.map((photo, i) => (
              <div
                key={photo.key ?? `${photo.label}-${i}`}
                className="relative h-full w-full shrink-0 snap-center"
              >
                <PhotoFill
                  photo={photo}
                  alt={`${title} — ${photo.label}`}
                  kind={kind}
                  contain
                  iconClassName="size-26 text-zinc-50/40"
                  priority={i === index}
                />
              </div>
            ))}
          </div>

          {total > 1 && (
            <>
              <LightboxArrow side="left" onClick={() => step(-1)}>
                <ChevronLeft className="size-5 stroke-[1.75]" aria-hidden="true" />
              </LightboxArrow>
              <LightboxArrow side="right" onClick={() => step(1)}>
                <ChevronRight className="size-5 stroke-[1.75]" aria-hidden="true" />
              </LightboxArrow>
            </>
          )}

          {photos[index]?.label && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-zinc-950/80 to-transparent px-4 pt-8 pb-4 text-center text-[13px] text-zinc-50/70">
              {photos[index].label}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LightboxArrow({
  side,
  onClick,
  children,
}: {
  side: "left" | "right";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Próxima foto"}
      // Escondida no celular: ali quem navega e o dedo, e o botao so tampava
      // a foto.
      className={
        "absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-50/20 bg-zinc-950/50 backdrop-blur-xs transition-colors hover:bg-zinc-50/10 sm:flex " +
        (side === "left" ? "left-3" : "right-3")
      }
    >
      {children}
    </button>
  );
}
