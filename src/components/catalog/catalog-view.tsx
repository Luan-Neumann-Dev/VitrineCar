"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/catalog/empty-state";
import { FilterBar } from "@/components/catalog/filter-bar";
import { FilterChips } from "@/components/catalog/filter-chips";
import { VehicleCard } from "@/components/vehicle-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plural } from "@/lib/format";
import {
  EMPTY_FILTERS,
  TAB_OPTIONS,
  applyFilters,
  filtersToQuery,
  type Filters,
  type TabKey,
} from "@/lib/filters";

import type { Vehicle } from "@/lib/vehicle";

type Props = {
  vehicles: Vehicle[];
  initialFilters: Filters;
};

/**
 * A vitrine inteira cabe numa resposta (~10 anuncios), entao o servidor manda
 * tudo e o filtro roda aqui: resposta instantanea, sem ida e volta.
 *
 * O estado espelha na URL por `history.replaceState` — a API nativa, que o
 * App Router respeita sem refazer a requisicao do servidor. Assim o link
 * filtrado continua compartilhavel e indexavel (a pagina server-side le os
 * mesmos parametros), mas mexer nos filtros nao custa um round-trip.
 */
export function CatalogView({ vehicles, initialFilters }: Props) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${filtersToQuery(filters)}`,
    );
  }, [filters]);

  const brands = useMemo(
    () =>
      Array.from(new Set(vehicles.map((v) => v.brand)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [vehicles],
  );

  const results = useMemo(
    () => applyFilters(vehicles, filters),
    [vehicles, filters],
  );

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <FilterBar filters={filters} brands={brands} onChange={set} />

      <main className="mx-auto w-full max-w-[1200px] px-5 pt-5.5 pb-18">
        <FilterChips
          filters={filters}
          onRemove={(key) => set(key, EMPTY_FILTERS[key])}
          onClearAll={() => setFilters(EMPTY_FILTERS)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4.5">
          <p className="text-sm text-muted-foreground">
            {results.length > 0 &&
              `${plural(results.length, "veículo encontrado", "veículos encontrados")}`}
          </p>
          <Tabs
            value={filters.tab}
            onValueChange={(value) => set("tab", value as TabKey)}
          >
            <TabsList aria-label="Filtrar por situação">
              {TAB_OPTIONS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {results.map((vehicle, i) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyState onClear={() => setFilters(EMPTY_FILTERS)} />
        )}
      </main>
    </>
  );
}
