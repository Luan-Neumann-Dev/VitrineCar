import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Situacao do anuncio. Espelha os quatro estados do design:
 * "novo" (recem chegado), "disponivel", "reservado" e "vendido".
 */
export const VEHICLE_STATUSES = [
  "novo",
  "disponivel",
  "reservado",
  "vendido",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

/**
 * Tipo do veiculo. Define quais campos o editor mostra e o que a ficha
 * tecnica exibe — moto nao tem porta, carro nao tem cilindrada.
 */
export const VEHICLE_KINDS = ["carro", "moto"] as const;

export type VehicleKind = (typeof VEHICLE_KINDS)[number];

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),

    kind: text("kind").$type<VehicleKind>().notNull().default("carro"),

    brand: text("brand").notNull(),
    model: text("model").notNull(),
    version: text("version").notNull().default(""),

    /** Ano de fabricacao e ano do modelo, exibidos como "2022/2023". */
    yearFab: integer("year_fab").notNull(),
    year: integer("year").notNull(),

    /** Reais inteiros. Carro nao tem centavos, entao nada de decimal aqui. */
    price: integer("price").notNull().default(0),
    mileage: integer("mileage").notNull().default(0),

    transmission: text("transmission").notNull().default("Automático"),
    fuel: text("fuel").notNull().default("Flex"),
    color: text("color").notNull().default(""),
    /** Carro. Moto usa `displacement`. */
    doors: integer("doors").notNull().default(4),
    engine: text("engine").notNull().default(""),
    plateEnd: text("plate_end").notNull().default(""),

    /** Moto: cilindrada em cc, marchas, e os itens que todo anuncio informa. */
    displacement: integer("displacement").notNull().default(0),
    gears: integer("gears").notNull().default(0),
    startType: text("start_type").notNull().default(""),
    brakes: text("brakes").notNull().default(""),
    cooling: text("cooling").notNull().default(""),

    ipvaPaid: integer("ipva_paid", { mode: "boolean" }).notNull().default(true),
    oneOwner: integer("one_owner", { mode: "boolean" }).notNull().default(false),
    inspection: integer("inspection", { mode: "boolean" })
      .notNull()
      .default(false),

    status: text("status").$type<VehicleStatus>().notNull().default("novo"),

    /** Lista de opcionais serializada em JSON. Nunca e filtrada no banco. */
    features: text("features", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),

    /**
     * Etiquetas livres do vendedor ("Único dono", "Aceito troca", "Baixa km").
     * Aparecem no card e no anuncio, e viram filtro clicavel na vitrine.
     */
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),

    description: text("description").notNull().default(""),

    /** Ordem de destaque na vitrine, controlada pelas setas do painel. */
    position: integer("position").notNull().default(0),

    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("vehicles_slug_idx").on(t.slug),
    index("vehicles_position_idx").on(t.position),
  ],
);

export const vehicleImages = sqliteTable(
  "vehicle_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    /**
     * Chave do objeto no R2 (ex.: "veiculos/7/frente-a1b2c3").
     * Nulo enquanto o anuncio so tem a legenda da foto e nenhum arquivo
     * enviado — nesse caso a vitrine desenha o placeholder do design.
     */
    key: text("key"),
    label: text("label").notNull().default("Foto"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("vehicle_images_vehicle_idx").on(t.vehicleId, t.position)],
);

export type VehicleRow = typeof vehicles.$inferSelect;
export type VehicleImageRow = typeof vehicleImages.$inferSelect;

/**
 * Tentativas de login malsucedidas, para limitar forca bruta contra a senha
 * unica do painel. Registros antigos sao descartados na propria checagem, sem
 * rotina de limpeza separada.
 */
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ip: text("ip").notNull(),
    at: integer("at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ip, t.at)],
);
