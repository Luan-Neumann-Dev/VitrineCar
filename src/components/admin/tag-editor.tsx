"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  TAG_SUGGESTIONS,
  normalizeTags,
} from "@/lib/vehicle-kind";

/**
 * Etiquetas livres do anuncio. Sao o unico campo em que o vendedor escreve o
 * que quiser e aparece em destaque, entao o limite e curto de proposito: oito
 * chips ainda cabem no card, quinze viram poluicao.
 */
export function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [value, setValue] = useState("");
  const full = tags.length >= MAX_TAGS;

  const add = (tag: string) => {
    const next = normalizeTags([...tags, tag]);
    if (next.length !== tags.length) onChange(next);
    setValue("");
  };

  const has = (tag: string) =>
    tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  // Só as sugestões que ainda não foram usadas — repetir o que já está
  // marcado logo acima só ocupa espaço.
  const available = TAG_SUGGESTIONS.filter((tag) => !has(tag));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Etiquetas
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          {tags.length}/{MAX_TAGS}
        </span>
      </div>

      <p className="text-[12.5px] text-muted-foreground">
        Aparecem no card e no anúncio, e viram filtro na vitrine. Use para o que
        não cabe na ficha técnica: “Aceito troca”, “Pneus novos”, “Primeira moto”.
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-7.5 items-center gap-1 rounded-md border border-zinc-900 bg-zinc-900 py-0 pr-1.5 pl-2.5 text-[13px] font-medium text-zinc-50"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                aria-label={`Remover etiqueta ${tag}`}
                className="flex size-4.5 items-center justify-center rounded-sm transition-colors hover:bg-zinc-50/20"
              >
                <X className="size-3 stroke-[2.5]" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        value={value}
        maxLength={MAX_TAG_LENGTH}
        disabled={full}
        placeholder={
          full
            ? `Limite de ${MAX_TAGS} etiquetas`
            : "Escreva uma etiqueta e aperte Enter"
        }
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(event) => {
          // Vírgula também confirma: é como a maioria digita uma lista.
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            if (value.trim()) add(value);
          }
          if (event.key === "Backspace" && !value && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => value.trim() && add(value)}
        className="h-[38px] max-w-[380px] rounded-md bg-background"
      />

      {!full && available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="inline-flex h-7.5 items-center gap-1.5 rounded-md border border-dashed bg-background px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-zinc-400 hover:text-foreground"
            >
              <Plus className="size-3 stroke-2" aria-hidden="true" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
