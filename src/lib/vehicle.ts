import { brl, km } from "./format";
import type { Photo } from "./photos";
import { whatsappLink } from "./site";
import type { VehicleKind, VehicleStatus } from "@/db/schema";

export type Vehicle = {
  id: number;
  slug: string;
  kind: VehicleKind;
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
  displacement: number;
  gears: number;
  startType: string;
  brakes: string;
  cooling: string;
  ipvaPaid: boolean;
  oneOwner: boolean;
  inspection: boolean;
  status: VehicleStatus;
  features: string[];
  tags: string[];
  description: string;
  position: number;
  photos: Photo[];
};

/** "160 cc" — vazio quando o vendedor nao informou. */
export const cc = (value: number) => (value > 0 ? `${value} cc` : "");

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

/**
 * Linha de resumo sob o titulo. Carro mostra o cambio; moto mostra a
 * cilindrada, que e o primeiro dado que o comprador procura.
 * "2022/2023 · 38.400 km · Automático · Flex"
 */
export const summaryLine = (v: Vehicle) =>
  [
    `${v.yearFab}/${v.year}`,
    km(v.mileage),
    v.kind === "moto" ? cc(v.displacement) || v.transmission : v.transmission,
    v.fuel,
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * Ficha tecnica. Cada tipo tem os seus campos; os comuns aos dois ficam no
 * inicio. Campos vazios sao descartados para a grade nao virar um mural de
 * travessoes — o vendedor preenche o que sabe.
 */
export const specs = (v: Vehicle) => {
  const common = [
    { label: "Ano/modelo", value: `${v.yearFab}/${v.year}` },
    { label: "Quilometragem", value: km(v.mileage) },
    { label: "Câmbio", value: v.transmission },
    { label: "Combustível", value: v.fuel },
    { label: "Cor", value: v.color },
  ];

  const specific =
    v.kind === "moto"
      ? [
          { label: "Cilindrada", value: cc(v.displacement) },
          { label: "Marchas", value: v.gears > 0 ? `${v.gears} marchas` : "" },
          { label: "Partida", value: v.startType },
          { label: "Freios", value: v.brakes },
          { label: "Refrigeração", value: v.cooling },
        ]
      : [
          { label: "Portas", value: v.doors > 0 ? `${v.doors} portas` : "" },
          { label: "Motor", value: v.engine },
        ];

  const documents = [
    { label: "Final da placa", value: v.plateEnd },
    { label: "IPVA", value: v.ipvaPaid ? "Pago" : "Em aberto" },
    { label: "Único dono", value: v.oneOwner ? "Sim" : "Não" },
    { label: "Laudo cautelar", value: v.inspection ? "Aprovado" : "Não realizado" },
  ];

  return [...common, ...specific, ...documents].filter((spec) => spec.value);
};

export function vehicleWhatsappLink(v: Vehicle) {
  // Moto e feminina: "na Fazer 250 ... anunciada". Carro, masculino.
  const [artigo, anunciado] =
    v.kind === "moto" ? ["na", "anunciada"] : ["no", "anunciado"];

  return whatsappLink(
    `Olá! Tenho interesse ${artigo} ${fullTitle(v)} ${v.year} ${anunciado} por ` +
      `${brl(v.price)}. Ainda está disponível?`,
  );
}

/**
 * Ate tres veiculos parecidos: mesmo tipo primeiro (nao adianta oferecer um
 * carro a quem olha moto), depois mesma marca, depois preco mais proximo.
 * Vendidos ficam de fora — nao adianta oferecer o que ja foi.
 */
export function similarTo(v: Vehicle, all: Vehicle[]) {
  return all
    .filter((x) => x.slug !== v.slug && x.status !== "vendido")
    .sort(
      (a, b) =>
        Number(b.kind === v.kind) - Number(a.kind === v.kind) ||
        Number(b.brand === v.brand) - Number(a.brand === v.brand) ||
        Math.abs(a.price - v.price) - Math.abs(b.price - v.price),
    )
    .slice(0, 3);
}
