import { FUELS, KIND_PLURAL, TRANSMISSIONS, VEHICLE_KINDS } from "./vehicle-kind";
import type { VehicleKind } from "./vehicle-kind";
import type { Vehicle } from "./vehicle";

export type SortKey =
  | "relevancia"
  | "menor-preco"
  | "maior-preco"
  | "mais-novo"
  | "menor-km";

export type TabKey = "todos" | "disponiveis" | "reservados" | "vendidos";

/** "" = todos os tipos. */
export type KindFilter = "" | VehicleKind;

export type Filters = {
  q: string;
  kind: KindFilter;
  brand: string;
  price: string;
  year: string;
  transmission: string;
  fuel: string;
  tag: string;
  sort: SortKey;
  tab: TabKey;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  kind: "",
  brand: "",
  price: "",
  year: "",
  transmission: "",
  fuel: "",
  tag: "",
  sort: "relevancia",
  tab: "todos",
};

/**
 * Nomes dos parametros na URL. Em portugues de proposito: o vendedor manda
 * esses links no WhatsApp, entao "?marca=Honda&preco=80-120" precisa ser
 * legivel para quem recebe.
 */
const PARAM: Record<keyof Filters, string> = {
  q: "busca",
  kind: "tipo",
  brand: "marca",
  price: "preco",
  year: "ano",
  transmission: "cambio",
  fuel: "combustivel",
  tag: "etiqueta",
  sort: "ordenar",
  tab: "situacao",
};

export type Option = { value: string; label: string };

export const KIND_OPTIONS: Option[] = [
  { value: "", label: "Tipo: todos" },
  ...VEHICLE_KINDS.map((kind) => ({ value: kind, label: KIND_PLURAL[kind] })),
];

/**
 * Faixas de preco. Carro e moto vivem em ordens de grandeza diferentes — as
 * faixas de carro engoliriam a vitrine de motos inteira numa opcao so — entao
 * cada tipo tem a sua, e a chave da URL diz de qual se trata.
 */
const PRICE_RANGES: Record<string, [number, number]> = {
  "ate-80": [0, 80_000],
  "80-120": [80_000, 120_000],
  "120-160": [120_000, 160_000],
  "acima-160": [160_000, Number.POSITIVE_INFINITY],

  "ate-10": [0, 10_000],
  "10-20": [10_000, 20_000],
  "20-40": [20_000, 40_000],
  "acima-40": [40_000, Number.POSITIVE_INFINITY],
};

const CAR_PRICES: Option[] = [
  { value: "", label: "Preço: qualquer" },
  { value: "ate-80", label: "Até R$ 80 mil" },
  { value: "80-120", label: "R$ 80 a 120 mil" },
  { value: "120-160", label: "R$ 120 a 160 mil" },
  { value: "acima-160", label: "Acima de R$ 160 mil" },
];

const MOTO_PRICES: Option[] = [
  { value: "", label: "Preço: qualquer" },
  { value: "ate-10", label: "Até R$ 10 mil" },
  { value: "10-20", label: "R$ 10 a 20 mil" },
  { value: "20-40", label: "R$ 20 a 40 mil" },
  { value: "acima-40", label: "Acima de R$ 40 mil" },
];

/** As faixas de moto so aparecem depois de filtrar por moto. */
export const priceOptions = (kind: KindFilter): Option[] =>
  kind === "moto" ? MOTO_PRICES : CAR_PRICES;

/** Uniao dos dois tipos quando nenhum esta selecionado. */
const unique = (values: string[]) => Array.from(new Set(values));

const fromKind = (kind: KindFilter, byKind: Record<VehicleKind, string[]>) =>
  kind ? byKind[kind] : unique(VEHICLE_KINDS.flatMap((k) => byKind[k]));

export const transmissionOptions = (kind: KindFilter): Option[] => [
  { value: "", label: "Câmbio: todos" },
  ...fromKind(kind, TRANSMISSIONS).map((v) => ({ value: v, label: v })),
];

export const fuelOptions = (kind: KindFilter): Option[] => [
  { value: "", label: "Combustível: todos" },
  ...fromKind(kind, FUELS).map((v) => ({ value: v, label: v })),
];

export const YEAR_OPTIONS: Option[] = [
  { value: "", label: "Ano: qualquer" },
  { value: "2024", label: "De 2024" },
  { value: "2022", label: "De 2022" },
  { value: "2020", label: "De 2020" },
  { value: "2018", label: "De 2018" },
];

export const SORT_OPTIONS: Option[] = [
  { value: "relevancia", label: "Ordenar: destaques" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "mais-novo", label: "Mais novo" },
  { value: "menor-km", label: "Menor km" },
];

export const TAB_OPTIONS: { value: TabKey; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "disponiveis", label: "Disponíveis" },
  { value: "reservados", label: "Reservados" },
  { value: "vendidos", label: "Vendidos" },
];

const SORTERS: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
  relevancia: () => 0,
  "menor-preco": (a, b) => a.price - b.price,
  "maior-preco": (a, b) => b.price - a.price,
  "mais-novo": (a, b) => b.year - a.year || a.mileage - b.mileage,
  "menor-km": (a, b) => a.mileage - b.mileage,
};

const oneOf = <T extends string>(value: string, allowed: readonly T[], fallback: T) =>
  (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) ?? "";
  const value = source[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseFilters(source: ParamSource): Filters {
  const sortValues = SORT_OPTIONS.map((o) => o.value) as SortKey[];
  const tabValues = TAB_OPTIONS.map((o) => o.value);
  return {
    q: read(source, PARAM.q).slice(0, 80),
    kind: oneOf(read(source, PARAM.kind), ["", ...VEHICLE_KINDS] as const, ""),
    brand: read(source, PARAM.brand),
    price: read(source, PARAM.price) in PRICE_RANGES ? read(source, PARAM.price) : "",
    year: YEAR_OPTIONS.some((o) => o.value && o.value === read(source, PARAM.year))
      ? read(source, PARAM.year)
      : "",
    transmission: read(source, PARAM.transmission),
    fuel: read(source, PARAM.fuel),
    tag: read(source, PARAM.tag).slice(0, 40),
    sort: oneOf(read(source, PARAM.sort), sortValues, "relevancia"),
    tab: oneOf(read(source, PARAM.tab), tabValues, "todos"),
  };
}

/**
 * Troca o tipo limpando o que deixou de fazer sentido. "Diesel" e a faixa de
 * R$ 120 a 160 mil nao existem em moto: mantidos, devolveriam zero resultado
 * e o visitante culparia a vitrine.
 */
export function withKind(filters: Filters, kind: KindFilter): Filters {
  const valid = (options: Option[], value: string) =>
    options.some((option) => option.value === value);

  return {
    ...filters,
    kind,
    price: valid(priceOptions(kind), filters.price) ? filters.price : "",
    transmission: valid(transmissionOptions(kind), filters.transmission)
      ? filters.transmission
      : "",
    fuel: valid(fuelOptions(kind), filters.fuel) ? filters.fuel : "",
  };
}

/** Serializa omitindo tudo que esta no padrao, para a URL ficar limpa. */
export function filtersToQuery(filters: Filters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM) as (keyof Filters)[]) {
    const value = filters[key];
    if (value && value !== EMPTY_FILTERS[key]) params.set(PARAM[key], value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function applyFilters(all: Vehicle[], filters: Filters): Vehicle[] {
  const term = filters.q.trim().toLowerCase();
  const range = PRICE_RANGES[filters.price];
  const minYear = filters.year ? Number(filters.year) : 0;
  const tag = filters.tag.trim().toLowerCase();

  const out = all.filter((v) => {
    // A busca varre as etiquetas junto: quem digita "aceito troca" espera
    // encontrar, mesmo que isso nunca apareca no nome do modelo.
    if (
      term &&
      !`${v.brand} ${v.model} ${v.version} ${v.tags.join(" ")}`
        .toLowerCase()
        .includes(term)
    )
      return false;
    if (filters.kind && v.kind !== filters.kind) return false;
    if (filters.brand && v.brand !== filters.brand) return false;
    if (range && (v.price < range[0] || v.price >= range[1])) return false;
    if (minYear && v.year < minYear) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    if (tag && !v.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (filters.tab === "disponiveis")
      return v.status !== "vendido" && v.status !== "reservado";
    if (filters.tab === "reservados") return v.status === "reservado";
    if (filters.tab === "vendidos") return v.status === "vendido";
    return true;
  });

  return out.sort(SORTERS[filters.sort]);
}

/** Filtros ativos em forma de chip removivel. A ordem segue a barra. */
export function activeChips(filters: Filters) {
  const label = (options: Option[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  const chips: { key: keyof Filters; label: string }[] = [];
  if (filters.q.trim()) chips.push({ key: "q", label: `“${filters.q.trim()}”` });
  if (filters.kind)
    chips.push({ key: "kind", label: label(KIND_OPTIONS, filters.kind) });
  if (filters.brand) chips.push({ key: "brand", label: filters.brand });
  if (filters.price)
    chips.push({ key: "price", label: label(priceOptions(filters.kind), filters.price) });
  if (filters.year) chips.push({ key: "year", label: `De ${filters.year}` });
  if (filters.transmission)
    chips.push({ key: "transmission", label: filters.transmission });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel });
  if (filters.tag.trim()) chips.push({ key: "tag", label: filters.tag.trim() });
  return chips;
}

export const hasActiveFilters = (filters: Filters) =>
  activeChips(filters).length > 0 || filters.tab !== "todos";
