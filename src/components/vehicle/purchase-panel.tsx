import { WhatsAppIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { ShareButton } from "@/components/vehicle/share-button";
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

      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Atendimento direto com o proprietário. Aceito troca e financiamento com
        entrada.
      </p>
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
      <ShareButton title={fullTitle(vehicle)} className="h-10.5 self-start" />
    </div>
  );
}
