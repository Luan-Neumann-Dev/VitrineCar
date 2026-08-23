"use client";

import { X } from "lucide-react";

import { activeChips, type Filters } from "@/lib/filters";

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: Filters;
  onRemove: (key: keyof Filters) => void;
  onClearAll: () => void;
}) {
  const chips = activeChips(filters);
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          aria-label={`Remover filtro ${chip.label}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-zinc-100 py-0 pr-1.5 pl-2.5 text-xs font-medium transition-colors hover:bg-zinc-200"
        >
          {chip.label}
          <X className="size-3.5 stroke-2" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
      >
        Limpar tudo
      </button>
    </div>
  );
}
