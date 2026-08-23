"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { PhotoFill } from "@/components/photo-fill";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Photo } from "@/lib/photos";

type Props = {
  photos: Photo[];
  index: number;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStep: (direction: 1 | -1) => void;
};

export function PhotoLightbox({
  photos,
  index,
  title,
  open,
  onOpenChange,
  onStep,
}: Props) {
  const current = photos[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onStep(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onStep(-1);
          }
        }}
        // O Dialog do shadcn entra com zoom; numa peca que ocupa a tela inteira
        // isso escala o viewport todo. O design pede so o fade.
        className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-zinc-950/95 p-0 text-zinc-50 ring-0 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-none"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <DialogTitle className="text-[13.5px] font-normal text-zinc-50/70">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-3">
            <span className="text-[13.5px] tabular-nums text-zinc-50/70">
              {photos.length ? `${index + 1}/${photos.length}` : "0/0"}
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

        <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 pb-6">
          <LightboxArrow label="Foto anterior" onClick={() => onStep(-1)}>
            <ChevronLeft className="size-5 stroke-[1.75]" aria-hidden="true" />
          </LightboxArrow>

          <div className="relative flex aspect-4/3 max-h-full w-full max-w-[1000px] flex-col items-center justify-center gap-3.5 overflow-hidden rounded-lg border border-zinc-50/15 bg-zinc-50/5">
            <PhotoFill
              photo={current}
              alt={title}
              contain
              iconClassName="size-26 text-zinc-50/40"
              priority
            />
            {current && (
              <span className="absolute bottom-4 text-[13px] text-zinc-50/60">
                {current.label}
              </span>
            )}
          </div>

          <LightboxArrow label="Próxima foto" onClick={() => onStep(1)}>
            <ChevronRight className="size-5 stroke-[1.75]" aria-hidden="true" />
          </LightboxArrow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LightboxArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-50/20 transition-colors hover:bg-zinc-50/10"
    >
      {children}
    </button>
  );
}
