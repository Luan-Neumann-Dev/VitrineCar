"use client";

import { Car, Check, Motorbike, Plus, X } from "lucide-react";

import { PhotoManager } from "@/components/admin/photo-manager";
import { TagEditor } from "@/components/admin/tag-editor";
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
import { VEHICLE_STATUSES, type VehicleKind } from "@/db/schema";
import { draftWithKind } from "@/lib/draft";
import { STATUS_LABELS } from "@/lib/vehicle";
import {
  BRAKES,
  COOLING,
  FEATURE_SUGGESTIONS,
  FUELS,
  KIND_LABELS,
  START_TYPES,
  TRANSMISSIONS,
  VEHICLE_KINDS,
} from "@/lib/vehicle-kind";
import { cn } from "@/lib/utils";

const numbers = new Intl.NumberFormat("pt-BR");
const onlyDigits = (value: string) => Number(value.replace(/\D/g, "")) || 0;

const KIND_ICONS: Record<VehicleKind, typeof Car> = { carro: Car, moto: Motorbike };

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
      placeholder: string;
      inputMode?: "numeric";
      onChange: (value: string) => void;
    }
  | {
      kind: "select";
      label: string;
      value: string;
      placeholder: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
    };

export function AdEditor({ draft, pending, onChange, onSave, onCancel }: Props) {
  const isMoto = draft.kind === "moto";

  const text = (
    label: string,
    key: keyof VehicleDraft,
    placeholder: string,
  ): Field => ({
    kind: "text",
    label,
    placeholder,
    value: String(draft[key] ?? ""),
    onChange: (value) => onChange({ [key]: value } as Partial<VehicleDraft>),
  });

  const digits = (
    label: string,
    key: keyof VehicleDraft,
    placeholder: string,
    grouped = false,
  ): Field => ({
    kind: "text",
    label,
    placeholder,
    inputMode: "numeric",
    value: draft[key]
      ? grouped
        ? numbers.format(Number(draft[key]))
        : String(draft[key])
      : "",
    onChange: (value) => onChange({ [key]: onlyDigits(value) } as Partial<VehicleDraft>),
  });

  const select = (
    label: string,
    key: keyof VehicleDraft,
    options: string[],
    placeholder = "Escolha",
  ): Field => ({
    kind: "select",
    label,
    placeholder,
    value: String(draft[key] ?? ""),
    options: options.map((option) => ({ value: option, label: option })),
    onChange: (value) => onChange({ [key]: value } as Partial<VehicleDraft>),
  });

  // Campos comuns, depois os do tipo, depois documento e situação. Trocar o
  // tipo troca a lista inteira — moto não tem porta, carro não tem cilindrada.
  const fields: Field[] = [
    text("Marca", "brand", isMoto ? "Honda" : "Chevrolet"),
    text("Modelo", "model", isMoto ? "CG 160" : "Onix"),
    text("Versão", "version", isMoto ? "Titan Start" : "1.0 Turbo LTZ"),
    digits("Ano de fabricação", "yearFab", "2022"),
    digits("Ano do modelo", "year", "2023"),
    digits("Preço (R$)", "price", isMoto ? "14.900" : "89.900", true),
    digits("Quilometragem (km)", "mileage", isMoto ? "12.400" : "38.400", true),
    select("Câmbio", "transmission", TRANSMISSIONS[draft.kind]),
    select("Combustível", "fuel", FUELS[draft.kind]),
    text("Cor", "color", isMoto ? "Vermelha" : "Prata"),

    ...(isMoto
      ? [
          digits("Cilindrada (cc)", "displacement", "160"),
          {
            kind: "select" as const,
            label: "Marchas",
            // Scooter fica em branco: o câmbio já diz "Automática (CVT)".
            placeholder: "Quantas marchas",
            value: String(draft.gears || ""),
            options: [3, 4, 5, 6].map((n) => ({
              value: String(n),
              label: `${n} marchas`,
            })),
            onChange: (value: string) => onChange({ gears: Number(value) }),
          },
          select("Partida", "startType", START_TYPES, "Elétrica, pedal…"),
          select("Freios", "brakes", BRAKES, "ABS, CBS, disco…"),
          select("Refrigeração", "cooling", COOLING, "Ar ou líquida"),
        ]
      : [
          {
            kind: "select" as const,
            label: "Portas",
            placeholder: "2 ou 4",
            value: String(draft.doors || ""),
            options: [
              { value: "2", label: "2 portas" },
              { value: "4", label: "4 portas" },
            ],
            // `doors` é número no banco: converter aqui evita gravar "4" como texto.
            onChange: (value: string) => onChange({ doors: Number(value) }),
          },
          text("Motor", "engine", "1.0 Turbo 12V"),
        ]),

    text("Final da placa", "plateEnd", "7"),
    {
      kind: "select",
      label: "Situação",
      placeholder: "Escolha",
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
  const suggestions = FEATURE_SUGGESTIONS[draft.kind];
  const features = [
    ...suggestions,
    ...draft.features.filter((f) => !suggestions.includes(f)),
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

      <div className="flex flex-col gap-2.5">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Tipo do veículo
        </span>
        <div role="radiogroup" aria-label="Tipo do veículo" className="flex gap-2">
          {VEHICLE_KINDS.map((kind) => {
            const Icon = KIND_ICONS[kind];
            const on = draft.kind === kind;
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(draftWithKind(draft, kind))}
                className={cn(
                  "inline-flex h-9.5 items-center gap-2 rounded-md border px-4 text-[13.5px] font-medium transition-colors",
                  on
                    ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                    : "bg-background text-muted-foreground hover:border-zinc-400 hover:text-foreground",
                )}
              >
                <Icon className="size-4 stroke-[1.75]" aria-hidden="true" />
                {KIND_LABELS[kind]}
              </button>
            );
          })}
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          Muda os campos da ficha técnica e a lista de opcionais.
        </p>
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
                placeholder={field.placeholder}
                inputMode={"inputMode" in field ? field.inputMode : undefined}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-[38px] rounded-md bg-background"
              />
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-[38px] w-full rounded-md bg-background">
                  <SelectValue placeholder={field.placeholder} />
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

      <TagEditor tags={draft.tags} onChange={(tags) => onChange({ tags })} />

      <div className="h-px bg-border" />

      <label className="flex flex-col gap-1.5">
        <span className="text-[11.5px] tracking-wider text-muted-foreground uppercase">
          Observações do vendedor
        </span>
        <Textarea
          rows={4}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={
            isMoto
              ? "Ex.: Segunda dona, sempre guardada na garagem. Revisões em dia, pneus e relação trocados há 2 mil km. Documento 2026 pago, pronta para transferir."
              : "Ex.: Revisões feitas na concessionária, todas na agenda digital. Pneus trocados há 6 mil km, sem retoques de pintura. Aceito troca por carro de menor valor."
          }
          className="rounded-md bg-background text-sm leading-relaxed"
        />
      </label>

      {actions("lg")}
    </div>
  );
}
