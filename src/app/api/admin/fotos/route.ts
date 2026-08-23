import { getCloudflareContext } from "@opennextjs/cloudflare";

import { hasSession } from "@/lib/auth";
import { objectKey } from "@/lib/photos";

/** 6 MB ja e folgado para um WebP de 1600px; acima disso e coisa errada. */
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Upload direto para o R2 pelo binding do Worker.
 *
 * Nao usamos URL assinada aqui: o Worker fala com o bucket por binding, sem
 * credencial nenhuma, e nao existe o limite de corpo de 4,5 MB que obrigaria a
 * desviar do servidor em outras hospedagens. Assinar so acrescentaria chaves
 * de acesso e uma biblioteca de assinatura sem ganho.
 */
export async function POST(request: Request) {
  if (!(await hasSession())) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const form = await request.formData();
  const full = form.get("full");
  const thumb = form.get("thumb");
  const label = String(form.get("label") || "Foto").slice(0, 60);
  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;

  if (!(full instanceof File) || !(thumb instanceof File)) {
    return Response.json({ error: "Envio incompleto" }, { status: 400 });
  }
  if (full.size > MAX_BYTES || thumb.size > MAX_BYTES) {
    return Response.json({ error: "Foto grande demais" }, { status: 413 });
  }

  const { env } = await getCloudflareContext({ async: true });
  // Sem prefixo: a rota /fotos ja da o contexto e evita URL com "fotos/fotos".
  const key = crypto.randomUUID();

  await Promise.all([
    env.PHOTOS.put(objectKey(key, "full"), await full.arrayBuffer(), {
      httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
    }),
    env.PHOTOS.put(objectKey(key, "thumb"), await thumb.arrayBuffer(), {
      httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" },
    }),
  ]);

  return Response.json({ key, label, width, height });
}
