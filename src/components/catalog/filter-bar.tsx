"use client";

import { ListFilter, Search } from "lucide-react";
import { useState } from "react";

import { FilterSelect } from "@/components/catalog/filter-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  KIND_OPTIONS,
  SORT_OPTIONS,
  YEAR_OPTIONS,
  fuelOptions,
  priceOptions,
  transmissionOptions,
  type Filters,
  type KindFilter,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: Filters;
  brands: string[];
  /** Só vale oferecer o filtro de tipo quando a vitrine tem carro e moto. */
  showKind: boolean;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onKindChange: (kind: KindFilter) => void;
};

export function FilterBar({
  filters,
  brands,
  showKind,
  onChange,
  onKindChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const selects = [
    ...(showKind
      ? [
          {
            label: "Tipo",
            value: filters.kind,
            onValueChange: (v: string) => onKindChange(v as KindFilter),
            options: KIND_OPTIONS,
          },
        ]
      : []),
    {
      label: "Marca",
      value: filters.brand,
      onValueChange: (v: string) => onChange("brand", v),
      options: [
        { value: "", label: "Marca: todas" },
        ...brands.map((b) => ({ value: b, label: b })),
      ],
    },
    {
      label: "Faixa de preço",
      value: filters.price,
      onValueChange: (v: string) => onChange("price", v),
      options: priceOptions(filters.kind),
    },
    {
      label: "Ano",
      value: filters.year,
      onValueChange: (v: string) => onChange("year", v),
      options: YEAR_OPTIONS,
    },
    {
      label: "Câmbio",
      value: filters.transmission,
      onValueChange: (v: string) => onChange("transmission", v),
      options: transmissionOptions(filters.kind),
    },
    {
      label: "Combustível",
      value: filters.fuel,
      onValueChange: (v: string) => onChange("fuel", v),
      options: fuelOptions(filters.kind),
    },
    {
      label: "Ordenar",
      value: filters.sort,
      onValueChange: (v: string) => onChange("sort", (v || "relevancia") as Filters["sort"]),
      options: SORT_OPTIONS,
    },
  ];

  return (
    <div className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2.5 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2 stroke-[1.75] text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={filters.q}
              onChange={(e) => onChange("q", e.target.value)}
              placeholder="Buscar por marca, modelo ou etiqueta"
              aria-label="Buscar veículos"
              className="h-10 rounded-md pl-8.5"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="h-10 rounded-md md:hidden"
          >
            <ListFilter className="size-[15px]" />
            Filtros
          </Button>
        </div>

        <div
          className={cn(
            "gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]",
            open ? "grid" : "hidden md:grid",
          )}
        >
          {selects.map((s) => (
            <FilterSelect
              key={s.label}
              label={s.label}
              value={s.value}
              options={s.options}
              onChange={s.onValueChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
