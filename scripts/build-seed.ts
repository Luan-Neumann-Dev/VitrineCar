/**
 * Compila src/db/seed-data.ts em seed/seed.sql.
 *
 * O SQL e gerado (e nao escrito a mao) para os dados de exemplo ficarem
 * tipados contra o schema do Drizzle. O arquivo resultante e aplicado pelo
 * wrangler, tanto local quanto remoto.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SEED_VEHICLES } from "../src/db/seed-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "seed/seed.sql");

const q = (value: string) => `'${value.replaceAll("'", "''")}'`;
const b = (value: boolean) => (value ? 1 : 0);

const lines: string[] = [
  "-- Gerado por `pnpm db:build-seed`. Nao edite a mao.",
  "DELETE FROM vehicle_images;",
  "DELETE FROM vehicles;",
  "DELETE FROM sqlite_sequence WHERE name IN ('vehicles', 'vehicle_images');",
  "",
];

SEED_VEHICLES.forEach((v, index) => {
  const id = index + 1;
  lines.push(
    "INSERT INTO vehicles (id, slug, kind, brand, model, version, year_fab, year, " +
      "price, mileage, transmission, fuel, color, doors, engine, plate_end, " +
      "displacement, gears, start_type, brakes, cooling, " +
      "ipva_paid, one_owner, inspection, status, features, tags, description, position) VALUES (" +
      [
        id,
        q(v.slug),
        q(v.kind ?? "carro"),
        q(v.brand),
        q(v.model),
        q(v.version),
        v.yearFab,
        v.year,
        v.price,
        v.mileage,
        q(v.transmission),
        q(v.fuel),
        q(v.color),
        v.doors,
        q(v.engine),
        q(v.plateEnd),
        v.displacement ?? 0,
        v.gears ?? 0,
        q(v.startType ?? ""),
        q(v.brakes ?? ""),
        q(v.cooling ?? ""),
        b(v.ipvaPaid),
        b(v.oneOwner),
        b(v.inspection),
        q(v.status),
        q(JSON.stringify(v.features)),
        q(JSON.stringify(v.tags ?? [])),
        q(v.description),
        index,
      ].join(", ") +
      ");",
  );

  v.photos.forEach((label, i) => {
    lines.push(
      "INSERT INTO vehicle_images (vehicle_id, key, label, position) VALUES (" +
        [id, "NULL", q(label), i].join(", ") +
        ");",
    );
  });

  lines.push("");
});

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n"), "utf8");

const photos = SEED_VEHICLES.reduce((n, v) => n + v.photos.length, 0);
console.log(
  `seed/seed.sql: ${SEED_VEHICLES.length} veiculos, ${photos} fotos (so legendas).`,
);
