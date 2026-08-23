import { WhatsAppIcon } from "@/components/icons";
import { brl } from "@/lib/format";
import { title as vehicleTitle, vehicleWhatsappLink, type Vehicle } from "@/lib/vehicle";

/** Barra fixa de contato no rodape — so em telas estreitas. */
export function MobileCta({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t bg-background/96 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[11.5px] text-muted-foreground">
          {vehicleTitle(vehicle)} {vehicle.year}
        </span>
        <strong className="text-[19px] font-semibold tracking-tight">
          {brl(vehicle.price)}
        </strong>
      </div>
      <a
        href={vehicleWhatsappLink(vehicle)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-[14.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/85"
      >
        <WhatsAppIcon className="size-4" />
        WhatsApp
      </a>
    </div>
  );
}
