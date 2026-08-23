"use client";

import { Check, Plus, X } from "lucide-react";

import { PhotoManager } from "@/components/admin/photo-manager";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VehicleDraft } from "@/app/admin/actions";
import { VEHICLE_STATUSES } from "@/db/schema";
import { FEATURE_SUGGESTIONS } from "@/lib/draft";
import { STATUS_LABELS } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

const numbers = new Intl.NumberFormat("pt-BR");
const onlyDigits = (value: string) => Number(value.replace(/\D/g, "")) || 0;

type Props = {
  draft: VehicleDraft;
  pending: boolean;
  onChange: (patch: Partial<VehicleDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
};

type Field =
  | {
      kind: "text";
      label: string;
      value: string;
      inputMode?: "numeric";
      onChange: (value: string) => void;
    }
  | {
      kind: "select";
      label: string;
      value: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
    };

export function AdEditor({ draft, pending, onChange, onSave, onCancel }: Props) {
  const text = (label: string, key: keyof VehicleDraft): Field => ({
    kind: "text",
    label,
    value: String(draft[key] ?? ""),
    onChange: (value) => onChange({ [key]: value } as Partial<VehicleDraft>),
  });

  const digits = (label: string, key: keyof VehicleDraft, grouped = false): Field => ({
    kind: "text",
    label,
    inputMode: "numeric",
    value: draft[key] ? (grouped ? numbers.format(Number(draft[key])) : String(draft[key])) : "",
    onChange: (value) => onChange({ [key]: onlyDigits(value) } as Partial<VehicleDraft>),
  });

  const select = (label: string, key: keyof VehicleDraft, options: string[]): Field => ({
    kind: "select",
    label,
    value: String(draft[key] ?? ""),
    options: options.map((option) => ({ value: option, label: option })),
    onChange: (value) => onChange({ [key]: value } as Partial<VehicleDraft>),
  });

  const fields: Field[] = [
    text("Marca", "brand"),
    text("Modelo", "model"),
    text("Versão", "version"),
    digits("Ano de fabricação", "yearFab"),
    digits("Ano do modelo", "year"),
    digits("Preço (R$)", "price", true),
    digits("Quilometragem (km)", "mileage", true),
    select("Câmbio", "transmission", ["Automático", "CVT", "Manual", "Automatizado"]),
    select("Combustível", "fuel", ["Flex", "Gasolina", "Diesel", "Híbrido", "Elétrico"]),
    text("Cor", "color"),
    {
      kind: "select",
      label: "Portas",
      value: String(draft.doors),
      options: [
        { value: "2", label: "2" },
        { value: "4", label: "4" },
      ],
      // `doors` é número no banco: converter aqui evita gravar "4" como texto.
      onChange: (value) => onChange({ doors: Number(value) }),
    },
    text("Motor", "engine"),
    text("Final da placa", "plateEnd"),
    {
      kind: "select",
      label: "Situação",
      value: draft.status,
      options: VEHICLE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
      onChange: (value) => onChange({ status: value as VehicleDraft["status"] }),
    },
  ];

  const toggles = [
    { label: "IPVA pago", on: draft.ipvaPaid, toggle: () => onChange({ ipvaPaid: !draft.ipvaPaid }) },
    { label: "Único dono", on: draft.oneOwner, toggle: () => onChange({ oneOwner: !draft.oneOwner }) },
    { label: "Laudo cautelar aprovado", on: draft.inspection, toggle: () => onChange({ inspection: !draft.inspection }) },
  ];

  // Sugestões primeiro, e no fim os opcionais que o anúncio já tem mas não
  // estão na lista padrão — assim nada que o vendedor escreveu some da tela.
  const features = [
    ...FEATURE_SUGGESTIONS,
    ...draft.features.filter((f) => !FEATURE_SUGGESTIONS.includes(f)),
  ];

  const actions = (size: "sm" | "lg") => (
    <div className={cn("flex items-center gap-2", size === "lg" && "justify-end")}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={pending}
        className={cn("rounded-md", size === "sm" ? "h-9" : "h-[38px]")}
      >
        Cancelar
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={pending}
        className={cn("rounded-md", size === "sm" ? "h-9" : "h-[38px]")}
      >
        {pending ? "Salvando…" : "Salvar anúncio"}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5.5 rounded-lg border bg-zinc-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold tracking-tight">
            {draft.id == null ? "Novo anúncio" : "Editar anúncio"}
          </h3>
          <p className="text-[13px] text-muted-foreground">
            Tudo que você preencher aqui aparece no anúncio público.
          </p>
        </div>
        {actions("sm")}
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {fields.map((field) => (
          <label key={field.label} className="flex flex-col gap-1.5">
            <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
              {field.label}
            </span>
            {field.kind === "text" ? (
              <Input
                value={field.value}
                inputMode={"inputMode" in field ? field.inputMode : undefined}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-[38px] rounded-md bg-background"
              />
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-[38px] w-full rounded-md bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </label>
        ))}
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2.5">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Documentação
        </span>
        <div className="flex flex-wrap gap-2">
          {toggles.map((toggle) => (
            <button
              key={toggle.label}
              type="button"
              role="switch"
              aria-checked={toggle.on}
              onClick={toggle.toggle}
              className={cn(
                "inline-flex h-8.5 items-center gap-2 rounded-md border px-3 text-[13.5px] font-medium transition-colors",
                toggle.on
                  ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                  : "bg-background text-muted-foreground hover:border-zinc-400 hover:text-foreground",
              )}
            >
              {toggle.on ? (
                <Check className="size-3.5 stroke-[2.25]" aria-hidden="true" />
              ) : (
                <X className="size-3.5 stroke-2" aria-hidden="true" />
              )}
              {toggle.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <PhotoManager photos={draft.photos} onChange={(photos) => onChange({ photos })} />

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2.5">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Opcionais
        </span>
        <div className="flex flex-wrap gap-1.5">
          {features.map((feature) => {
            const on = draft.features.includes(feature);
            return (
              <button
                key={feature}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    features: on
                      ? draft.features.filter((f) => f !== feature)
                      : [...draft.features, feature],
                  })
                }
                className={cn(
                  "inline-flex h-7.5 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                  on
                    ? "border border-zinc-900 bg-zinc-900 text-zinc-50"
                    : "border border-dashed bg-background text-muted-foreground hover:border-zinc-400 hover:text-foreground",
                )}
              >
                {on ? (
                  <Check className="size-3 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <Plus className="size-3 stroke-2" aria-hidden="true" />
                )}
                {feature}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Observações do vendedor
        </span>
        <Textarea
          rows={4}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Histórico de revisões, detalhes de conservação, condições de troca…"
          className="rounded-md bg-background text-sm leading-relaxed"
        />
      </label>

      {actions("lg")}
    </div>
  );
}
