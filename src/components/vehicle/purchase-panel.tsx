import { WhatsAppIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { ShareButton } from "@/components/vehicle/share-button";
import { TagList } from "@/components/vehicle/spec-sheet";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import {
  fullTitle,
  summaryLine,
  title as vehicleTitle,
  vehicleWhatsappLink,
  type Vehicle,
} from "@/lib/vehicle";

/** Coluna fixa da direita no desktop. No mobile o conteudo vira MobileHeadline. */
export function PurchasePanel({ vehicle }: { vehicle: Vehicle }) {
  return (
    <aside className="sticky top-7 hidden flex-col gap-4.5 rounded-lg border bg-card p-5.5 shadow-xs lg:flex">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl leading-tight font-semibold tracking-tight">
          {vehicleTitle(vehicle)}
        </h1>
        <p className="text-sm text-muted-foreground">{vehicle.version}</p>
      </div>

      <p className="text-[34px] leading-none font-semibold tracking-tight">
        {brl(vehicle.price)}
      </p>
      <p className="text-[13px] text-muted-foreground">{summaryLine(vehicle)}</p>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <Button asChild className="h-11.5 rounded-md text-[15px]">
          <a
            href={vehicleWhatsappLink(vehicle)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-[17px]" />
            Conversar no WhatsApp
          </a>
        </Button>
        <ShareButton title={fullTitle(vehicle)} />
      </div>

      {/*
        O que a loja aceita ("troca", "financio") é etiqueta do anúncio, não
        texto fixo: as condições mudam de carro para carro, e uma promessa
        impressa em todos eles é uma que o vendedor não escolheu fazer.
      */}
      <TagList tags={vehicle.tags} />
    </aside>
  );
}

/** Bloco de titulo e preco que aparece no lugar do painel em telas estreitas. */
export function MobileHeadline({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex flex-col gap-3 lg:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
          {vehicleTitle(vehicle)}
        </h1>
        <p className="text-sm text-muted-foreground">{vehicle.version}</p>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{brl(vehicle.price)}</p>
      <TagList tags={vehicle.tags} />
      <ShareButton title={fullTitle(vehicle)} className="h-10.5 self-start" />
    </div>
  );
}
