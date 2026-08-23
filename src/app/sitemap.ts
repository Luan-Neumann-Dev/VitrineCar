import type { MetadataRoute } from "next";

import { listVehicles } from "@/db/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await listVehicles();

  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...vehicles
      // Anuncio vendido continua no ar como historico, mas nao merece
      // prioridade nem ficar competindo com quem ainda esta a venda.
      .map((vehicle) => ({
        url: `${site.url}/veiculo/${vehicle.slug}`,
        changeFrequency: "weekly" as const,
        priority: vehicle.status === "vendido" ? 0.3 : 0.8,
      })),
  ];
}
