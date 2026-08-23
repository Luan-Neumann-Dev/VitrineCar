import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As fotos vem do R2 por um dominio proprio e ja sao gravadas em varios
  // tamanhos no upload, entao o otimizador do next/image nao entra em cena
  // (ele nao roda no Workers sem adaptacao).
  images: { unoptimized: true },
};

export default nextConfig;

// Torna os bindings do Cloudflare (D1, R2) visiveis durante `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
