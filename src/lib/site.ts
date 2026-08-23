/**
 * Identidade da loja. Tudo vem de variavel de ambiente para o vendedor
 * trocar nome, telefone e cidade sem ninguem mexer em codigo.
 * Os defaults sao os valores que estavam no prototipo.
 */
export const site = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Almeida Veículos",
  tagline:
    process.env.NEXT_PUBLIC_STORE_TAGLINE ||
    "Revenda de carros seminovos · Campinas, SP",
  hours: process.env.NEXT_PUBLIC_STORE_HOURS || "Atendimento de seg a sáb, 9h às 19h",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5519998877665",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** Dominio publico do bucket R2. Vazio ate o bucket existir (fase 2). */
  photosBaseUrl: process.env.NEXT_PUBLIC_PHOTOS_BASE_URL || "",
} as const;

/** "5519998877665" -> "(19) 99887-7665" */
export function prettyPhone(number: string = site.whatsapp) {
  return number.replace(/^55(\d\d)(\d{4,5})(\d{4})$/, "($1) $2-$3");
}

export function whatsappLink(message: string, number: string = site.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
