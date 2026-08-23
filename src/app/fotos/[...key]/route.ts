import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serve uma foto direto do bucket.
 *
 * E o caminho reserva: enquanto o R2 nao tem dominio publico proprio, as
 * fotos saem por aqui e o site funciona assim que a primeira e enviada. Com
 * NEXT_PUBLIC_PHOTOS_BASE_URL configurado, as URLs apontam direto para o CDN
 * do R2 e esta rota deixa de ser chamada.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/fotos/[...key]">,
) {
  const { key } = await params;
  const objectKey = key.join("/");

  const { env } = await getCloudflareContext({ async: true });
  const object = await env.PHOTOS.get(objectKey);
  if (!object) return new Response("Foto não encontrada", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/webp",
      // As chaves carregam um uuid, entao o conteudo nunca muda.
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
}
