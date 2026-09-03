import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serve uma foto direto do bucket.
 *
 * E o caminho reserva: enquanto o R2 nao tem dominio publico proprio, as
 * fotos saem por aqui e o site funciona assim que a primeira e enviada. Com
 * NEXT_PUBLIC_PHOTOS_BASE_URL configurado, as URLs apontam direto para o CDN
 * do R2 e esta rota deixa de ser chamada.
 */

/**
 * Formato exato do que o upload grava: uuid + variante + .webp. Recusar o
 * resto de cara evita que alguem use esta rota para varrer o bucket — cada
 * tentativa seria uma operacao de leitura no R2 na conta do vendedor.
 */
const OBJECT_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(thumb|full)\.webp$/;

/**
 * O cache compartilhado do datacenter. `caches.default` e do runtime da
 * Cloudflare — o lib "dom" do TypeScript descreve outro CacheStorage e nao
 * conhece esse campo, e em `next dev` ele nao existe mesmo.
 */
function edgeCache(): Cache | undefined {
  const store = globalThis.caches as unknown as { default?: Cache } | undefined;
  return store?.default;
}

export async function GET(
  request: Request,
  { params }: RouteContext<"/fotos/[...key]">,
) {
  const { key } = await params;
  const objectKey = key.join("/");

  if (!OBJECT_KEY.test(objectKey)) {
    return new Response("Foto não encontrada", { status: 404 });
  }

  // Cache do proprio datacenter. A partir do segundo pedido a foto sai daqui
  // sem tocar no R2 — o que mantem a franquia de operacoes do bucket intacta
  // mesmo se a mesma imagem for pedida aos milhares.
  // A chave e a URL, nao o objeto Request: o Request que chega aqui vem da
  // camada do Next e o Cache API do Worker nao o reconhece.
  const cache = edgeCache();
  const cached = await cache?.match(request.url);
  if (cached) return cached;

  const { env, ctx } = await getCloudflareContext({ async: true });
  const object = await env.PHOTOS.get(objectKey);
  if (!object) return new Response("Foto não encontrada", { status: 404 });

  const response = new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/webp",
      // As chaves carregam um uuid, entao o conteudo nunca muda.
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });

  // Guardar a copia nao pode segurar a resposta do visitante.
  ctx.waitUntil(cache?.put(request.url, response.clone()) ?? Promise.resolve());

  return response;
}
