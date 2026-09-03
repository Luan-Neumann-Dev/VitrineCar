import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Freio de mao por IP, antes de qualquer coisa cara acontecer.
 *
 * Roda no proprio Worker, na frente das rotas: quem passa do teto leva 429 e
 * a requisicao morre ali, sem consulta ao D1, sem leitura no R2 e sem
 * renderizacao. Isso protege a franquia de banco e de bucket — nao a de
 * requisicoes do Worker, que so a Cloudflare consegue barrar antes de nos
 * (ver "Limites na Cloudflare" no README).
 *
 * O contador e o binding nativo de rate limit (`ratelimits` no wrangler.jsonc):
 * mora na memoria do datacenter, nao custa operacao de banco e nao precisa de
 * limpeza. Em troca, a contagem e por datacenter, nao global — de proposito,
 * porque o objetivo aqui e cortar enxurrada, nao contar com precisao.
 *
 * Por que `middleware.ts` e nao `proxy.ts`: o Next 16 renomeou o arquivo e
 * deprecou este nome, mas todo arquivo chamado `proxy` e compilado para o
 * runtime Node, e o adaptador da Cloudflare (@opennextjs/cloudflare 1.20) so
 * aceita middleware de edge — com `proxy.ts` o build falha na hora. Voltar ao
 * nome antigo e o unico jeito de ter esta camada hoje; quando o adaptador
 * suportar Node, e so renomear o arquivo e a funcao.
 */

/**
 * Cada parte do site tem um ritmo normal muito diferente, entao cada uma tem
 * seu proprio contador. Uma pagina de veiculo puxa varias fotos de uma vez;
 * o painel manda um POST por foto enviada; a vitrine e o resto.
 */
function limiterFor(env: CloudflareEnv, pathname: string) {
  if (pathname.startsWith("/fotos/")) return env.RL_PHOTOS;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return env.RL_ADMIN;
  }
  return env.RL_PAGES;
}

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  // Sem IP nao da para contar por visitante. Acontece em `next dev`, onde nao
  // ha enxurrada para conter.
  if (!ip) return NextResponse.next();

  let allowed = true;
  try {
    const { env } = await getCloudflareContext({ async: true });
    // Binding ausente (deploy antigo, preview sem a config): passa direto.
    const limiter = limiterFor(env, request.nextUrl.pathname);
    if (limiter) allowed = (await limiter.limit({ key: ip })).success;
  } catch {
    // Fora do runtime do Worker, ou o contador falhou. O freio nunca pode ser
    // o motivo de o site sair do ar, entao aqui ele se desliga sozinho.
    return NextResponse.next();
  }

  if (allowed) return NextResponse.next();

  return new NextResponse(
    "Muitas requisições em pouco tempo. Espere alguns segundos e tente de novo.",
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain; charset=utf-8",
        // Uma resposta de bloqueio nunca pode ficar guardada no lugar da pagina.
        "Cache-Control": "no-store",
      },
    },
  );
}

export const config = {
  // Arquivo estatico e servido pelo binding de assets sem chegar ate aqui em
  // producao; a exclusao vale para o `next dev`, que serve tudo pelo Node.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
