import { Calendar, Fuel, Gauge, Settings2 } from "lucide-react";
import Link from "next/link";

import { PhotoFill } from "@/components/photo-fill";
import { StatusBadge } from "@/components/status-badge";
import { brl, km } from "@/lib/format";
import { cc, title as vehicleTitle, type Vehicle } from "@/lib/vehicle";

export function VehicleCard({
  vehicle,
  priority,
}: {
  vehicle: Vehicle;
  priority?: boolean;
}) {
  const title = vehicleTitle(vehicle);
  const meta = [
    { icon: Calendar, value: `${vehicle.yearFab}/${vehicle.year}` },
    { icon: Gauge, value: km(vehicle.mileage) },
    {
      icon: Settings2,
      // Na moto a cilindrada informa mais que o câmbio; sem ela, cai no câmbio.
      value:
        vehicle.kind === "moto"
          ? cc(vehicle.displacement) || vehicle.transmission
          : vehicle.transmission,
    },
    { icon: Fuel, value: vehicle.fuel },
  ].filter((item) => item.value);

  // Três etiquetas é o que cabe em duas linhas na largura do card.
  const tags = vehicle.tags.slice(0, 3);

  return (
    <Link
      href={`/veiculo/${vehicle.slug}`}
      aria-label={`Ver detalhes do ${title} ${vehicle.version}, ${brl(vehicle.price)}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
          <PhotoFill
            photo={vehicle.photos[0]}
            alt={`${title} ${vehicle.version} — foto principal`}
            kind={vehicle.kind}
            variant="thumb"
            priority={priority}
          />
        </div>
        {vehicle.status !== "disponivel" && (
          <StatusBadge status={vehicle.status} className="absolute top-3 left-3" />
        )}
      </div>

      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] leading-snug font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] leading-snug text-muted-foreground">
            {vehicle.version}
          </p>
        </div>

        <p className="text-xl font-semibold tracking-tight">{brl(vehicle.price)}</p>

        <div className="h-px bg-border" />

        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-muted-foreground">
          {meta.map(({ icon: Icon, value }) => (
            <span key={value} className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0 stroke-[1.75]" aria-hidden="true" />
              {value}
            </span>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-6 items-center rounded-md bg-muted px-2 text-[12px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
