"use client";

import {
  Car,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  ImageIcon,
  Motorbike,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_STATUSES, type VehicleStatus } from "@/db/schema";
import { brl, km, plural } from "@/lib/format";
import { photoUrl } from "@/lib/photos";
import { cc, STATUS_LABELS, type Vehicle } from "@/lib/vehicle";
import { KIND_LABELS } from "@/lib/vehicle-kind";
import { cn } from "@/lib/utils";

type Props = {
  vehicle: Vehicle;
  position: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMove: (direction: -1 | 1) => void;
  onStatus: (status: VehicleStatus) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function AdRow({
  vehicle,
  position,
  canMoveUp,
  canMoveDown,
  disabled,
  onMove,
  onStatus,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  const cover = vehicle.photos[0] ? photoUrl(vehicle.photos[0], "thumb") : null;
  const KindIcon = vehicle.kind === "moto" ? Motorbike : Car;
  const meta = [
    `${vehicle.yearFab}/${vehicle.year}`,
    km(vehicle.mileage),
    vehicle.kind === "moto" ? cc(vehicle.displacement) : vehicle.transmission,
    vehicle.fuel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-3.5 p-3.5">
      <div className="flex flex-col gap-0.5">
        <IconButton
          label="Subir na ordem de destaque"
          disabled={disabled || !canMoveUp}
          onClick={() => onMove(-1)}
          className="h-5 w-6 rounded-t-sm rounded-b-none"
        >
          <ChevronUp className="size-3 stroke-2" aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Descer na ordem de destaque"
          disabled={disabled || !canMoveDown}
          onClick={() => onMove(1)}
          className="h-5 w-6 rounded-t-none rounded-b-sm border-t-0"
        >
          <ChevronDown className="size-3 stroke-2" aria-hidden="true" />
        </IconButton>
      </div>

      <span className="w-5.5 shrink-0 text-[12.5px] tabular-nums text-zinc-400">
        {position}
      </span>

      <div className="relative grid aspect-4/3 w-19 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <ImageIcon className="size-5 stroke-[1.25] text-zinc-400" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
        <strong className="flex items-center gap-1.5 text-[14.5px] font-semibold tracking-tight">
          <KindIcon
            className="size-4 shrink-0 stroke-[1.75] text-muted-foreground"
            aria-label={KIND_LABELS[vehicle.kind]}
          />
          {`${vehicle.brand} ${vehicle.model}`.trim() || "Anúncio sem título"}
        </strong>
        <span className="truncate text-[13px] text-muted-foreground">
          {vehicle.version || "Sem versão informada"}
        </span>
        <span className="text-[12.5px] text-zinc-400">
          {meta} · {plural(vehicle.photos.length, "foto", "fotos")}
        </span>
      </div>

      <strong className="shrink-0 text-base font-semibold tracking-tight">
        {brl(vehicle.price)}
      </strong>

      <Select
        value={vehicle.status}
        onValueChange={(value) => onStatus(value as VehicleStatus)}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="Situação do anúncio"
          className="h-8.5 shrink-0 rounded-md text-[13px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VEHICLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="h-8.5 rounded-md border bg-background px-3 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Editar
        </button>
        <IconButton
          label="Duplicar anúncio"
          disabled={disabled}
          onClick={onDuplicate}
          className="size-8.5"
        >
          <Copy className="size-3.5 stroke-[1.75]" aria-hidden="true" />
        </IconButton>
        <Link
          href={`/veiculo/${vehicle.slug}`}
          title="Ver na vitrine"
          aria-label="Ver anúncio na vitrine"
          className="flex size-8.5 items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted"
        >
          <Eye className="size-3.5 stroke-[1.75]" aria-hidden="true" />
        </Link>
        <IconButton
          label="Excluir anúncio"
          disabled={disabled}
          onClick={onDelete}
          className="size-8.5 text-muted-foreground hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5 stroke-[1.75]" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-md border bg-background transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
