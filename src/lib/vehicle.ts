import { brl, km } from "./format";
import type { Photo } from "./photos";
import { whatsappLink } from "./site";
import type { VehicleStatus } from "@/db/schema";

export type Vehicle = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  version: string;
  yearFab: number;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  color: string;
  doors: number;
  engine: string;
  plateEnd: string;
  ipvaPaid: boolean;
  oneOwner: boolean;
  inspection: boolean;
  status: VehicleStatus;
  features: string[];
  description: string;
  position: number;
  photos: Photo[];
};

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  novo: "Novo",
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
};

/** "Chevrolet Onix" — o que vira <h1> e titulo do card. */
export const title = (v: Vehicle) => `${v.brand} ${v.model}`.trim();

/** "Chevrolet Onix 1.0 Turbo LTZ" — usado em metadata e compartilhamento. */
export const fullTitle = (v: Vehicle) => `${title(v)} ${v.version}`.trim();

/** "2022/2023 · 38.400 km · Automático · Flex" */
export const summaryLine = (v: Vehicle) =>
  [`${v.yearFab}/${v.year}`, km(v.mileage), v.transmission, v.fuel].join(" · ");

export const specs = (v: Vehicle) => [
  { label: "Ano/modelo", value: `${v.yearFab}/${v.year}` },
  { label: "Quilometragem", value: km(v.mileage) },
  { label: "Câmbio", value: v.transmission },
  { label: "Combustível", value: v.fuel },
  { label: "Cor", value: v.color },
  { label: "Portas", value: `${v.doors} portas` },
  { label: "Motor", value: v.engine },
  { label: "Final da placa", value: v.plateEnd },
  { label: "IPVA", value: v.ipvaPaid ? "Pago" : "Em aberto" },
  { label: "Único dono", value: v.oneOwner ? "Sim" : "Não" },
  { label: "Laudo cautelar", value: v.inspection ? "Aprovado" : "Não realizado" },
];

export function vehicleWhatsappLink(v: Vehicle) {
  return whatsappLink(
    `Olá! Tenho interesse no ${fullTitle(v)} ${v.year} anunciado por ` +
      `${brl(v.price)}. Ainda está disponível?`,
  );
}

/**
 * Ate tres veiculos parecidos: mesma marca primeiro, depois os de preco
 * mais proximo. Vendidos ficam de fora — nao adianta oferecer o que ja foi.
 */
export function similarTo(v: Vehicle, all: Vehicle[]) {
  return all
    .filter((x) => x.slug !== v.slug && x.status !== "vendido")
    .sort(
      (a, b) =>
        Number(b.brand === v.brand) - Number(a.brand === v.brand) ||
        Math.abs(a.price - v.price) - Math.abs(b.price - v.price),
    )
    .slice(0, 3);
}
