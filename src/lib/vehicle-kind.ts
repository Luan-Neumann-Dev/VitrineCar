import { VEHICLE_KINDS, type VehicleKind } from "@/db/schema";

export { VEHICLE_KINDS, type VehicleKind };

/**
 * Tudo que muda entre carro e moto vive aqui.
 *
 * O editor, a ficha tecnica, os filtros e os dados estruturados leem deste
 * arquivo — assim um campo novo de moto entra em um lugar so, e nao ha risco
 * de a vitrine mostrar "4 portas" numa Fazer 250.
 */
export const KIND_LABELS: Record<VehicleKind, string> = {
  carro: "Carro",
  moto: "Moto",
};

/** Plural para contagens e rotulos de filtro. */
export const KIND_PLURAL: Record<VehicleKind, string> = {
  carro: "Carros",
  moto: "Motos",
};

export const TRANSMISSIONS: Record<VehicleKind, string[]> = {
  carro: ["Automático", "CVT", "Manual", "Automatizado"],
  // "Automática" na moto e o scooter (CVT); "semiautomática" e a Pop/Biz.
  moto: ["Manual", "Semiautomática", "Automática (CVT)"],
};

export const FUELS: Record<VehicleKind, string[]> = {
  carro: ["Flex", "Gasolina", "Diesel", "Híbrido", "Elétrico"],
  moto: ["Gasolina", "Flex", "Elétrico"],
};

export const START_TYPES = ["Elétrica e pedal", "Elétrica", "Pedal"];

export const BRAKES = [
  "ABS nas duas rodas",
  "ABS na dianteira",
  "CBS (freio combinado)",
  "Disco e tambor",
  "Disco nas duas rodas",
  "Tambor nas duas rodas",
];

export const COOLING = ["Ar", "Ar e óleo", "Líquida"];

/** Opcionais sugeridos no editor; o vendedor marca os que o veiculo tem. */
export const FEATURE_SUGGESTIONS: Record<VehicleKind, string[]> = {
  carro: [
    "Ar-condicionado",
    "Ar-condicionado digital",
    "Direção elétrica",
    "Multimídia",
    "Câmera de ré",
    "Sensor de estacionamento",
    "Piloto automático",
    "Bancos em couro",
    "Faróis de LED",
    "Teto solar",
    "Rodas de liga",
    "Vidros elétricos",
    "Tração 4x4",
    "Painel digital",
    "Chave presencial",
  ],
  moto: [
    "Painel digital",
    "Farol de LED",
    "Alarme",
    "Partida elétrica",
    "Injeção eletrônica",
    "Baú / bagageiro",
    "Protetor de motor",
    "Protetor de mão",
    "Escapamento esportivo",
    "Bolha / para-brisa",
    "Rodas de liga",
    "Banco de gel",
    "Suporte de celular",
    "Carregador USB",
    "Manopla aquecida",
  ],
};

/** Sugestoes de etiqueta. O vendedor tambem pode escrever a dele. */
export const TAG_SUGGESTIONS = [
  "Aceito troca",
  "Financio com entrada",
  "Único dono",
  "Baixa quilometragem",
  "Primeira moto",
  "Pra trabalhar",
  "Novinha",
  "Revisada",
  "Todas revisões na autorizada",
  "Pneus novos",
  "Sem detalhes",
  "Repasse",
  "Preço negociável",
];

/**
 * Sanitiza etiquetas vindas do editor: apara, tira vazias e repetidas
 * (ignorando caixa) e limita tamanho — elas aparecem em chip, nao em paragrafo.
 */
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 28;

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length === MAX_TAGS) break;
  }

  return out;
}
