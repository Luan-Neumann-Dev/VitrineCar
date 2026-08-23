import type { Metadata } from "next";

import { CatalogView } from "@/components/catalog/catalog-view";
import { listVehicles } from "@/db/queries";
import { parseFilters } from "@/lib/filters";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} · Carros seminovos`,
  description: `Veja os veículos seminovos disponíveis na ${site.name}. Fotos, ficha técnica completa e contato direto pelo WhatsApp.`,
  alternates: { canonical: "/" },
};

export default async function CatalogPage({
  searchParams,
}: PageProps<"/">) {
  // Os filtros vem da URL para o link filtrado continuar compartilhavel:
  // a primeira renderizacao ja sai do servidor com o recorte certo.
  const [params, vehicles] = await Promise.all([searchParams, listVehicles()]);

  return (
    <CatalogView vehicles={vehicles} initialFilters={parseFilters(params)} />
  );
}
