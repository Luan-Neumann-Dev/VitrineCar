import type { Vehicle } from "./vehicle";

export type SortKey =
  | "relevancia"
  | "menor-preco"
  | "maior-preco"
  | "mais-novo"
  | "menor-km";

export type TabKey = "todos" | "disponiveis" | "reservados" | "vendidos";

export type Filters = {
  q: string;
  brand: string;
  price: string;
  year: string;
  transmission: string;
  fuel: string;
  sort: SortKey;
  tab: TabKey;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  brand: "",
  price: "",
  year: "",
  transmission: "",
  fuel: "",
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
  brand: "marca",
  price: "preco",
  year: "ano",
  transmission: "cambio",
  fuel: "combustivel",
  sort: "ordenar",
  tab: "situacao",
};

export type Option = { value: string; label: string };

export const PRICE_OPTIONS: Option[] = [
  { value: "", label: "Preço: qualquer" },
  { value: "ate-80", label: "Até R$ 80 mil" },
  { value: "80-120", label: "R$ 80 a 120 mil" },
  { value: "120-160", label: "R$ 120 a 160 mil" },
  { value: "acima-160", label: "Acima de R$ 160 mil" },
];

const PRICE_RANGES: Record<string, [number, number]> = {
  "ate-80": [0, 80_000],
  "80-120": [80_000, 120_000],
  "120-160": [120_000, 160_000],
  "acima-160": [160_000, Number.POSITIVE_INFINITY],
};

export const YEAR_OPTIONS: Option[] = [
  { value: "", label: "Ano: qualquer" },
  { value: "2024", label: "De 2024" },
  { value: "2022", label: "De 2022" },
  { value: "2020", label: "De 2020" },
  { value: "2018", label: "De 2018" },
];

export const TRANSMISSION_OPTIONS: Option[] = [
  { value: "", label: "Câmbio: todos" },
  { value: "Automático", label: "Automático" },
  { value: "CVT", label: "CVT" },
  { value: "Manual", label: "Manual" },
];

export const FUEL_OPTIONS: Option[] = [
  { value: "", label: "Combustível: todos" },
  { value: "Flex", label: "Flex" },
  { value: "Diesel", label: "Diesel" },
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
    brand: read(source, PARAM.brand),
    price: read(source, PARAM.price) in PRICE_RANGES ? read(source, PARAM.price) : "",
    year: YEAR_OPTIONS.some((o) => o.value && o.value === read(source, PARAM.year))
      ? read(source, PARAM.year)
      : "",
    transmission: read(source, PARAM.transmission),
    fuel: read(source, PARAM.fuel),
    sort: oneOf(read(source, PARAM.sort), sortValues, "relevancia"),
    tab: oneOf(read(source, PARAM.tab), tabValues, "todos"),
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

  const out = all.filter((v) => {
    if (term && !`${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(term))
      return false;
    if (filters.brand && v.brand !== filters.brand) return false;
    if (range && (v.price < range[0] || v.price >= range[1])) return false;
    if (minYear && v.year < minYear) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
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
  if (filters.brand) chips.push({ key: "brand", label: filters.brand });
  if (filters.price)
    chips.push({ key: "price", label: label(PRICE_OPTIONS, filters.price) });
  if (filters.year) chips.push({ key: "year", label: `De ${filters.year}` });
  if (filters.transmission)
    chips.push({ key: "transmission", label: filters.transmission });
  if (filters.fuel) chips.push({ key: "fuel", label: filters.fuel });
  return chips;
}

export const hasActiveFilters = (filters: Filters) =>
  activeChips(filters).length > 0 || filters.tab !== "todos";
