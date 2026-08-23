"use client";

import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <SearchX className="size-5 stroke-[1.75]" aria-hidden="true" />
      </span>
      <p className="text-[15px] font-semibold">
        Nenhum veículo encontrado com esses filtros
      </p>
      <p className="max-w-[42ch] text-sm text-muted-foreground">
        Tente ampliar a faixa de preço ou remover algum filtro. Se procura um modelo
        específico, me chame no WhatsApp.
      </p>
      <Button variant="outline" onClick={onClear} className="mt-1 h-[38px] rounded-md">
        Limpar filtros
      </Button>
    </div>
  );
}
