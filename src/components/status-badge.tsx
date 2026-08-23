import { STATUS_LABELS } from "@/lib/vehicle";
import type { VehicleStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

/**
 * As quatro situacoes tem pesos visuais diferentes de proposito:
 * "Novo" chama atencao, "Vendido" avisa em vermelho, e os outros dois
 * ficam discretos.
 */
const STYLES: Record<VehicleStatus, string> = {
  novo: "bg-zinc-900 text-zinc-50",
  reservado: "bg-white text-zinc-900 border border-zinc-200",
  vendido: "bg-destructive text-zinc-50",
  disponivel: "bg-zinc-100 text-zinc-900",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2.5 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
