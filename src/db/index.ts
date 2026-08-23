import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/**
 * Cliente Drizzle sobre o D1.
 *
 * Sempre na forma assincrona: em `next dev` o binding vem de uma instancia
 * do Miniflare que sobe sob demanda, e so a versao async espera por ela.
 */
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema, casing: "snake_case" });
}

export type Db = Awaited<ReturnType<typeof getDb>>;
