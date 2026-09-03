import { absolutePhotoUrl } from "./photos";
import { site } from "./site";
import { fullTitle, type Vehicle } from "./vehicle";

const AVAILABILITY: Record<string, string> = {
  vendido: "https://schema.org/SoldOut",
  reservado: "https://schema.org/LimitedAvailability",
  novo: "https://schema.org/InStock",
  disponivel: "https://schema.org/InStock",
};

/**
 * Motor. No carro e o texto que o vendedor escreveu ("1.0 Turbo 12V"); na
 * moto e a cilindrada, que o schema.org expressa como valor com unidade.
 */
function engineSpec(vehicle: Vehicle) {
  if (vehicle.kind === "moto") {
    if (!vehicle.displacement) return undefined;
    return {
      "@type": "EngineSpecification",
      engineDisplacement: {
        "@type": "QuantitativeValue",
        value: vehicle.displacement,
        unitCode: "CMQ", // centimetro cubico
      },
    };
  }

  return vehicle.engine
    ? { "@type": "EngineSpecification", name: vehicle.engine }
    : undefined;
}

/**
 * Dados estruturados do anuncio.
 *
 * E isso que faz o carro aparecer na busca do Google com preco e ano, em vez
 * de so um link azul — o retorno mais direto de ter saido do hash routing.
 */
export function vehicleJsonLd(vehicle: Vehicle) {
  const url = `${site.url}/veiculo/${vehicle.slug}`;
  const images = vehicle.photos
    .map((photo) => absolutePhotoUrl(photo))
    .filter((src): src is string => Boolean(src));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        // schema.org tem Motorcycle como irmao de Car; usar o tipo certo e o
        // que permite ao Google mostrar o resultado como moto.
        "@type": vehicle.kind === "moto" ? "Motorcycle" : "Car",
        "@id": url,
        name: fullTitle(vehicle),
        url,
        description: vehicle.description,
        brand: { "@type": "Brand", name: vehicle.brand },
        model: vehicle.model,
        vehicleConfiguration: vehicle.version,
        productionDate: String(vehicle.yearFab),
        vehicleModelDate: String(vehicle.year),
        color: vehicle.color || undefined,
        numberOfDoors: vehicle.kind === "moto" ? undefined : vehicle.doors,
        vehicleTransmission: vehicle.transmission,
        fuelType: vehicle.fuel,
        vehicleEngine: engineSpec(vehicle),
        mileageFromOdometer: {
          "@type": "QuantitativeValue",
          value: vehicle.mileage,
          unitCode: "KMT",
        },
        ...(images.length ? { image: images } : {}),
        offers: {
          "@type": "Offer",
          url,
          price: vehicle.price,
          priceCurrency: "BRL",
          itemCondition: "https://schema.org/UsedCondition",
          availability: AVAILABILITY[vehicle.status] ?? AVAILABILITY.disponivel,
          seller: { "@type": "AutoDealer", name: site.name },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Catálogo", item: site.url },
          {
            "@type": "ListItem",
            position: 2,
            name: vehicle.brand,
            item: `${site.url}/?marca=${encodeURIComponent(vehicle.brand)}`,
          },
          { "@type": "ListItem", position: 3, name: vehicle.model, item: url },
        ],
      },
    ],
  };
}
