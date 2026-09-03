import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { VehicleCard } from "@/components/vehicle-card";
import { Gallery } from "@/components/vehicle/gallery";
import { MobileCta } from "@/components/vehicle/mobile-cta";
import {
  MobileHeadline,
  PurchasePanel,
} from "@/components/vehicle/purchase-panel";
import { FeatureList, SpecSheet } from "@/components/vehicle/spec-sheet";
import { getVehicleBySlug } from "@/db/queries";
import { brl } from "@/lib/format";
import { vehicleJsonLd } from "@/lib/json-ld";
import { absolutePhotoUrl } from "@/lib/photos";
import { fullTitle, similarTo, summaryLine } from "@/lib/vehicle";

export async function generateMetadata({
  params,
}: PageProps<"/veiculo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { vehicle } = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Anúncio não encontrado" };

  const title = `${fullTitle(vehicle)} ${vehicle.year}`;
  const description = `${brl(vehicle.price)} · ${summaryLine(vehicle)}. ${vehicle.description}`.slice(
    0,
    300,
  );
  // A capa do anuncio e a melhor previa possivel no WhatsApp: e a foto do
  // carro. Sem foto ainda, o link vai so com titulo e descricao.
  const cover = vehicle.photos[0] ? absolutePhotoUrl(vehicle.photos[0]) : null;

  return {
    title,
    description,
    alternates: { canonical: `/veiculo/${vehicle.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/veiculo/${vehicle.slug}`,
      ...(cover ? { images: [{ url: cover, alt: title }] } : {}),
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function VehiclePage({
  params,
}: PageProps<"/veiculo/[slug]">) {
  const { slug } = await params;
  const { vehicle, all } = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const similar = similarTo(vehicle, all);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(vehicle)) }}
      />

      <main className="mx-auto w-full max-w-[1200px] px-5 pt-4.5 pb-10">
        <Breadcrumb className="pb-4.5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Catálogo</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/?marca=${encodeURIComponent(vehicle.brand)}`}>
                  {vehicle.brand}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{vehicle.model}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <Gallery
              photos={vehicle.photos}
              kind={vehicle.kind}
              title={fullTitle(vehicle)}
            />
            <MobileHeadline vehicle={vehicle} />

            <div className="h-px bg-border" />

            <SpecSheet vehicle={vehicle} />
            <FeatureList features={vehicle.features} />

            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold tracking-tight">
                Observações do vendedor
              </h2>
              <p className="max-w-[70ch] text-[15px] leading-relaxed">
                {vehicle.description}
              </p>
            </section>
          </div>

          <PurchasePanel vehicle={vehicle} />
        </div>

        {similar.length > 0 && (
          <section className="flex flex-col gap-4.5 pt-14">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Veículos parecidos
              </h2>
              <Link
                href="/"
                className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver catálogo completo
              </Link>
            </div>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}
      </main>

      <MobileCta vehicle={vehicle} />
    </>
  );
}
