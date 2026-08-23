const numbers = new Intl.NumberFormat("pt-BR");

/** Precos sao inteiros em reais — carro nao tem centavos. */
export const brl = (value: number) => `R$ ${numbers.format(value || 0)}`;

export const km = (value: number) => `${numbers.format(value || 0)} km`;

export const plural = (count: number, one: string, many: string) =>
  count === 1 ? `1 ${one}` : `${count} ${many}`;

/** "Chevrolet Onix 1.0 Turbo LTZ 2023" -> "chevrolet-onix-1-0-turbo-ltz-2023" */
export function slugify(parts: Array<string | number | null | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
