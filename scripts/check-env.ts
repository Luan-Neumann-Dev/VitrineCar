/**
 * Trava de segurança: impede que segredo entre em arquivo .env.
 *
 * O Next carrega `.env.local` também no build de produção, e com precedência
 * MAIOR que `.env.production`. Uma senha deixada ali para desenvolvimento é
 * compilada dentro do bundle e publicada junto com o site — foi exatamente o
 * que aconteceu uma vez neste projeto.
 *
 * A regra é simples: arquivos .env só podem conter `NEXT_PUBLIC_*`, que já são
 * públicos por construção. Senha e chave de sessão vão por `wrangler secret
 * put` (produção) e `.dev.vars` (local), que o build nunca lê.
 *
 * Roda antes de todo build. Falha o deploy em vez de vazar.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FILES = [".env", ".env.local", ".env.production", ".env.development"];

const offenders: { file: string; key: string }[] = [];

for (const file of FILES) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;

  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const key = line.split("=")[0]?.trim();
    if (key && !key.startsWith("NEXT_PUBLIC_")) {
      offenders.push({ file, key });
    }
  }
}

if (offenders.length) {
  console.error("\n✖ Segredo em arquivo .env — build interrompido.\n");
  for (const { file, key } of offenders) {
    console.error(`  ${file}: ${key}`);
  }
  console.error(
    "\n  Arquivos .env viram parte do bundle publicado. Só NEXT_PUBLIC_* pode",
    "\n  ficar neles. Mova o que está acima para:",
    "\n    produção → npx wrangler secret put NOME",
    "\n    local    → .dev.vars (não versionado, lido pelo runtime do Worker)\n",
  );
  process.exit(1);
}

console.log("✓ Nenhum segredo nos arquivos .env.");
