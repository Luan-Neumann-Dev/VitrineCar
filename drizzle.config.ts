import { defineConfig } from "drizzle-kit";

/**
 * Usado apenas para gerar SQL a partir do schema:
 *   pnpm db:generate
 * A aplicacao das migracoes fica com o wrangler (local e remoto), que le a
 * pasta `migrations` declarada no wrangler.jsonc.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
  casing: "snake_case",
});
