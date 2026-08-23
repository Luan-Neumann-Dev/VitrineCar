import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Le um segredo do ambiente.
 *
 * Em producao os valores chegam como secrets do Worker (`wrangler secret put`);
 * em `next dev` vem do .env.local. As duas origens aparecem em lugares
 * diferentes, entao consultamos as duas.
 */
export async function secret(name: string): Promise<string> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as unknown as Record<string, string | undefined>)[name];
    if (value) return value;
  } catch {
    // Fora do runtime do Worker (build, scripts): cai no process.env.
  }
  return process.env[name] ?? "";
}
