"use client";

import { ChevronLeft, ChevronRight, ImageIcon, Trash2, Upload, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { photoUrl, type Photo } from "@/lib/photos";
import { preparePhoto } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 12;

export function PhotoManager({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) {
  const [uploading, setUploading] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;

    setUploading(files.length);
    const added: Photo[] = [];

    try {
      // Uma de cada vez: no 4G do pátio, disparar oito uploads juntos deixa
      // todos lentos e ainda estoura memória ao redimensionar em paralelo.
      for (const file of files) {
        try {
          const prepared = await preparePhoto(file);
          const body = new FormData();
          body.append("full", prepared.full, "full.webp");
          body.append("thumb", prepared.thumb, "thumb.webp");
          body.append("label", prepared.label);
          body.append("width", String(prepared.width));
          body.append("height", String(prepared.height));

          const response = await fetch("/api/admin/fotos", { method: "POST", body });
          if (!response.ok) {
            const payload = (await response
              .json()
              .catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error || "Falha no envio");
          }
          added.push((await response.json()) as Photo);
        } catch (error) {
          toast.error(
            `Não consegui subir "${file.name}": ${error instanceof Error ? error.message : "erro desconhecido"}`,
          );
        } finally {
          setUploading((n) => n - 1);
        }
      }
    } finally {
      setUploading(0);
      if (added.length) onChange([...photos, ...added]);
    }
  }

  const swap = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  const drop = (event: DragEvent, to: number) => {
    event.preventDefault();
    if (dragIndex == null || dragIndex === to) return;
    const next = [...photos];
    next.splice(to, 0, next.splice(dragIndex, 1)[0]);
    setDragIndex(null);
    onChange(next);
  };

  const full = photos.length >= MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Fotos
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          {photos.length === 1 ? "1 foto" : `${photos.length} fotos`} · a primeira é a
          capa
        </span>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(e.dataTransfer?.files ?? null);
        }}
        className="flex flex-col items-center gap-2.5 rounded-lg border border-dashed bg-card p-5.5 text-center"
      >
        <span className="flex size-[38px] items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <UploadCloud className="size-4.5 stroke-[1.75]" aria-hidden="true" />
        </span>
        <p className="text-[13.5px]">
          {uploading > 0 ? "Enviando fotos…" : "Arraste as fotos aqui"}
        </p>
        <p className="text-[12.5px] text-muted-foreground">
          Reduzimos e convertemos no seu navegador antes de enviar. Depois arraste as
          miniaturas para reordenar.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={full || uploading > 0}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8.5 items-center gap-1.5 rounded-md border bg-background px-3.5 text-[13.5px] font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <Upload className="size-3.5 stroke-[1.75]" aria-hidden="true" />
          Escolher do computador
        </button>
        {full && (
          <p className="text-[12.5px] text-muted-foreground">
            Limite de {MAX_PHOTOS} fotos por anúncio.
          </p>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(132px,1fr))]">
          {photos.map((photo, index) => {
            const src = photoUrl(photo, "thumb");
            return (
              <div
                key={photo.key ?? `${photo.label}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, index)}
                className="flex cursor-grab flex-col gap-1.5 rounded-lg border bg-card p-2 active:cursor-grabbing"
              >
                <div className="relative grid aspect-4/3 place-items-center overflow-hidden rounded-md bg-muted">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={photo.label}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <ImageIcon
                      className="size-6 stroke-[1.25] text-zinc-400"
                      aria-hidden="true"
                    />
                  )}
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 inline-flex h-5 items-center rounded-sm bg-zinc-900 px-1.5 text-[10.5px] font-medium tracking-wide text-zinc-50">
                      CAPA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <PhotoButton
                    label="Mover foto para trás"
                    disabled={index === 0}
                    onClick={() => swap(index, index - 1)}
                  >
                    <ChevronLeft className="size-3.5 stroke-2" aria-hidden="true" />
                  </PhotoButton>
                  <PhotoButton
                    label="Mover foto para frente"
                    disabled={index === photos.length - 1}
                    onClick={() => swap(index, index + 1)}
                  >
                    <ChevronRight className="size-3.5 stroke-2" aria-hidden="true" />
                  </PhotoButton>
                  <PhotoButton
                    label="Remover foto"
                    destructive
                    className="ml-auto"
                    onClick={() => onChange(photos.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-3.5 stroke-[1.75]" aria-hidden="true" />
                  </PhotoButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">
          Sem fotos ainda. O card do catálogo mostra um placeholder até você subir a
          primeira.
        </p>
      )}
    </div>
  );
}

function PhotoButton({
  label,
  onClick,
  disabled,
  destructive,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-6.5 items-center justify-center rounded-sm border bg-background transition-colors disabled:opacity-40",
        destructive
          ? "text-muted-foreground hover:border-destructive hover:text-destructive"
          : "hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}
