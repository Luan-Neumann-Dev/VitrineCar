import { Check } from "lucide-react";

import { specs, type Vehicle } from "@/lib/vehicle";

export function SpecSheet({ vehicle }: { vehicle: Vehicle }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold tracking-tight">Ficha técnica</h2>
      <div className="grid overflow-hidden rounded-lg border bg-card [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
        {specs(vehicle).map((spec) => (
          <div
            key={spec.label}
            className="flex flex-col gap-0.5 p-4 shadow-[inset_-1px_-1px_0_0_var(--border)]"
          >
            <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
              {spec.label}
            </span>
            <span className="text-[14.5px] font-medium">{spec.value || "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeatureList({ features }: { features: string[] }) {
  if (!features.length) return null;

  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="text-base font-semibold tracking-tight">Opcionais</h2>
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => (
          <span
            key={feature}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-muted px-2.5 text-[13px] font-medium"
          >
            <Check
              className="size-3.5 stroke-[2.25] text-muted-foreground"
              aria-hidden="true"
            />
            {feature}
          </span>
        ))}
      </div>
    </section>
  );
}
