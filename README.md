# Vitrine Carros

> A used-car dealership catalog that runs entirely on Cloudflare's free tier — server-rendered listings, WhatsApp-first contact, and a self-service admin panel where the seller publishes a car in under a minute.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%C2%B7%20D1%20%C2%B7%20R2-F38020?logo=cloudflare&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<div align="center">

![Vitrine Carros](https://github.com/user-attachments/assets/c0714b4f-49bc-4987-897f-cb729c2df1cf)
![Vitrine Carros](https://github.com/user-attachments/assets/66a35f47-c432-49a7-a102-9530e077e744)

**[🚀 Live Demo](https://vitrine-carros.lnneumann.workers.dev/) · [📖 Setup Guide](STARTUP.md) · [🐛 Report a Bug](https://github.com/Luan-Neumann-Dev/VitrineCar/issues)**

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Architecture](#️-architecture)
- [Database Schema](#️-database-schema)
- [Challenges & Solutions](#-challenges--solutions)
- [Security](#-security)
- [Performance & Cost](#-performance--cost)
- [What I Learned](#-what-i-learned)
- [Roadmap](#️-roadmap)
- [License](#-license)
- [Contact](#-contact)

## 🎯 About The Project

I bought a few vehicles and needed to sell them. I also wanted to learn how to
build a site that handles photos properly. Those two things landed in the same
month, so the second one became the answer to the first.

Around here, vehicles get sold on WhatsApp and Instagram: the car lives in a photo
album, the price lives in a caption, and none of it is indexable. Someone
searching Google for *"Civic 2019"* never finds the person who has one parked
outside.

**Vitrine Carros** is the storefront that was missing. Every listing is a real,
crawlable URL (`/veiculo/honda-civic-2019`) with structured data attached, so the
car shows up in search results *with its price and year*, not just as a blue link.
The contact button is still WhatsApp — that is where the deal actually closes —
but it opens a conversation already carrying the exact vehicle.

Then something I had not planned for happened: friends started asking whether they
could list their vehicles on it too. That turned a personal tool into something
other people rely on, and it is what pushed the project past the point where I
would otherwise have stopped — the seller panel, motorcycle support, the rate
limiting. Someone else's listing going down is a different kind of problem than my
own going down. Everything is run from a phone: log into `/admin`, drag the photos
in, and the listing is live.

### Why I Built This

The starting goal was small and concrete — learn how to handle photos end to end:
uploading them, storing them, and serving them fast without paying for it.

The constraint I set was that the whole thing had to fit inside Cloudflare's free
tier and stay there, even when a scraper finds it at 3 a.m. That constraint turned
out to be the most useful part of the project. On an edge runtime there is no
filesystem, no long-lived process, and 10 ms of CPU per request, so several
defaults from the Next.js ecosystem simply do not apply: the `next/image`
optimizer, Node middleware, and signed-URL uploads all had to be replaced with
something that works inside a Worker. Those replacements are the most interesting
code in the repository, and they are documented in
[Challenges & Solutions](#-challenges--solutions).

## ✨ Features

### Core Functionality

- 🚗 **Cars and motorcycles from one schema** — a listing's `kind` drives which spec fields the editor shows, which the spec sheet renders, and which filters exist. A motorcycle has displacement, gears, starter type, brakes and cooling; a car has doors and engine. Diesel is not offered as a motorcycle fuel, and a sunroof is not offered as a motorcycle option.
- 🔎 **Instant faceted filtering** — brand, price band, year, transmission, fuel, type, free-text search and sorting, all applied in the browser with zero requests per click, while the URL stays shareable and server-renderable.
- 🏷️ **Free-form seller tags** — up to eight per listing ("Trade-ins welcome", "New tires", "One owner"). They show on the card, join the text search, and each one becomes a clickable filter link.
- 📸 **Drag-and-drop photo manager** — reorder by dragging thumbnails, the first photo becomes the cover, and deleting removes both stored variants from the bucket.
- 💬 **WhatsApp-first contact** — every CTA opens a chat pre-filled with the vehicle and its link; the seller's number is a single environment variable.
- 🔐 **Password-protected admin panel** — JWT session in an `HttpOnly` cookie. No user table, no sign-up flow: one seller, one password.

### User Experience

- Server-rendered listings, so the first paint already contains the cars — no spinner, no layout shift.
- Status is a first-class concept: *new*, *available*, *reserved*, *sold*, each with its own badge and filter tab.
- Lightbox gallery with keyboard navigation, and a sticky mobile CTA that follows the buyer down the page.
- Dark mode via `next-themes`, and a share button using the Web Share API where available.

### Technical Features

- 🛡️ **Edge rate limiting** that rejects floods *before* any D1 query, R2 read, or render happens.
- 🖼️ **Client-side image pipeline** — photos are resized and converted to WebP in the browser, in two variants, before upload. A 3.8 MB phone photo leaves the device as ~13 KB + ~4 KB.
- 🔎 **`schema.org` structured data** per listing — `Car` or `Motorcycle`, with offer, price and mileage — plus a generated `sitemap.xml` and `robots.txt`.
- 🚧 **A build-time guard that fails the deploy** if a secret ever appears in a `.env` file.

## 🛠️ Tech Stack

**Application**

- **Next.js 16** (App Router) — server components for the catalog, server actions for every write
- **React 19** + **TypeScript 5** — strict mode throughout
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives) — design system, Geist type scale, zinc palette
- **next-themes**, **sonner**, **lucide-react** — theming, toasts, icons

**Backend & Infrastructure**

- **Cloudflare Workers** — hosting and runtime, via [`@opennextjs/cloudflare`](https://github.com/opennextjs/opennextjs-cloudflare)
- **Cloudflare D1** (SQLite at the edge) — catalog storage
- **Cloudflare R2** — photo storage, reached through a Worker binding (no credentials in the app)
- **Drizzle ORM** + **drizzle-kit** — typed queries and versioned migrations
- **jose** — HS256 JWT signing and verification in a Web Crypto runtime
- **Cloudflare rate limiting bindings** — per-IP counters living in datacenter memory

**Tooling**

- **pnpm** (with `node-linker=hoisted`), **Wrangler**, **ESLint**, **tsx**

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10
- A free **Cloudflare account** (no credit card required to start)

### Quick Start (local)

```bash
# 1. Clone the repository
git clone https://github.com/Luan-Neumann-Dev/VitrineCar.git
cd VitrineCar

# 2. Install dependencies
pnpm install

# 3. Create .dev.vars with the local admin secrets (never a .env file — see below)
printf 'ADMIN_PASSWORD="local-dev-password"\nADMIN_SESSION_SECRET="local-dev-secret"\n' > .dev.vars

# 4. Generate the Cloudflare binding types
pnpm cf:typegen

# 5. Create the local D1 database and seed 12 demo vehicles
pnpm db:reset:local

# 6. Run it
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The admin panel is at
`/admin`, using the password from step 3.

> **Secrets never go in a `.env` file.** `.env` files are compiled *into* the
> published bundle. `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` travel through
> `.dev.vars` locally and `wrangler secret put` in production. `pnpm check:env`
> enforces this and runs before every build.

### Deploying to Cloudflare

The full walkthrough — creating D1 and R2, setting secrets, pointing a custom
domain, hardening the WAF — is in **[STARTUP.md](STARTUP.md)** (written in
Portuguese, for someone standing up their own copy without a developer around).

The short version:

```bash
npx wrangler login
pnpm cf:db:create          # then paste the database_id into wrangler.jsonc
pnpm cf:r2:create
pnpm db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
pnpm cf:deploy
```

### Available Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next dev server with the Cloudflare runtime underneath |
| `pnpm cf:preview` | Build and run on the real Workers runtime locally |
| `pnpm cf:deploy` | Check env, build with OpenNext, deploy to Cloudflare |
| `pnpm db:generate` | Generate a Drizzle migration from the schema |
| `pnpm db:reset:local` | Rebuild the local D1 database with demo data |
| `pnpm db:migrate:remote` | Apply pending migrations to production |
| `pnpm check:env` | Fail if any non-`NEXT_PUBLIC_` variable sits in a `.env` file |
| `pnpm typecheck` / `pnpm lint` | TypeScript and ESLint |

## 📁 Project Structure

```
VitrineCar/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Catalog (server-rendered, filter-aware)
│   │   ├── veiculo/[slug]/         # Listing page + JSON-LD
│   │   ├── admin/                  # Seller panel + server actions
│   │   ├── api/admin/fotos/        # Photo upload endpoint (writes to R2)
│   │   ├── fotos/[...key]/         # Photo delivery with edge caching
│   │   ├── sitemap.ts, robots.ts   # SEO surface
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── catalog/                # Filter bar, chips, empty state
│   │   ├── vehicle/                # Gallery, lightbox, spec sheet, CTA
│   │   ├── admin/                  # Editor, photo manager, tag editor, login
│   │   └── ui/                     # shadcn/ui primitives
│   │
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (source of truth)
│   │   ├── queries.ts              # Every read and write against D1
│   │   └── seed-data.ts            # 12 demo vehicles
│   │
│   ├── lib/
│   │   ├── auth.ts                 # JWT session, constant-time compare, lockout
│   │   ├── vehicle-kind.ts         # Car vs. motorcycle field definitions
│   │   ├── filters.ts              # Filter state <-> URL, shared by both sides
│   │   ├── resize-image.ts         # Browser-side WebP pipeline
│   │   └── photos.ts, json-ld.ts, env.ts, site.ts
│   │
│   └── middleware.ts               # Per-IP rate limiting at the edge
│
├── migrations/                     # Drizzle-generated SQL, applied by Wrangler
├── scripts/
│   ├── check-env.ts                # Build-time secret guard
│   └── build-seed.ts               # Turns seed-data.ts into seed.sql
├── wrangler.jsonc                  # Bindings: D1, R2, rate limiters, assets
└── STARTUP.md                      # Deployment & operations guide (pt-BR)
```

## 🏗️ Architecture

Everything runs in a single Cloudflare Worker. There is no origin server, no
container, and no connection pool — the database and the bucket are *bindings*
handed to the Worker by the runtime.

```
                       ┌────────────────────────────────────┐
   Buyer ──── HTTPS ──▶│ middleware.ts — per-IP rate limit   │──▶ 429 (no DB, no R2)
                       └───────────────┬────────────────────┘
                                       │ allowed
                       ┌───────────────▼────────────────────┐
                       │ Next.js App Router (RSC)           │
                       │ server components + server actions │
                       └───┬───────────────┬────────────────┘
                           │ Drizzle       │ binding
                    ┌──────▼──────┐  ┌─────▼───────┐
                    │ D1 (SQLite) │  │ R2 (photos) │
                    └─────────────┘  └─────┬───────┘
                                           │
                                  edge cache (immutable keys)
```

### Key design decisions

**Infrastructure-agnostic by intent.** The database is reached through Drizzle and
the photos through the R2 API. Moving to Postgres and S3 means swapping a driver
and a deploy command, not rewriting the queries — a deliberate hedge against
betting the product on one vendor's adapter.

**Reads are server-side, filtering is client-side.** The catalog holds roughly ten
listings, so the server ships all of them at once and the filter runs in the
browser — see [Challenge 3](#challenge-3-instant-filters-that-are-still-real-urls).

**Every write goes through a server action that calls `requireSession()` before
touching the database.** Authorization is never a matter of the UI hiding a
button: every exported function in a `"use server"` file is a public endpoint, and
it is treated as one.

**The panel keeps no local copy of the catalog.** Each action writes to D1 and
refetches. That is one extra round trip per click, in exchange for the screen
always showing what is actually stored.

## 🗄️ Database Schema

Three tables in SQLite (D1), defined in [`src/db/schema.ts`](src/db/schema.ts) and
migrated with drizzle-kit.

#### `vehicles`

```
- id                  integer, PK, autoincrement
- slug                text, unique      -- "honda-civic-2019"
- kind                text              -- "carro" | "moto"
- brand, model, version                 -- text
- year_fab, year      integer           -- displayed as "2022/2023"
- price, mileage      integer           -- whole BRL; cars have no cents
- transmission, fuel, color, engine, plate_end
- doors               integer           -- cars
- displacement, gears, start_type, brakes, cooling   -- motorcycles
- ipva_paid, one_owner, inspection      -- boolean flags
- status              text              -- "novo" | "disponivel" | "reservado" | "vendido"
- features            text (JSON array) -- optional equipment
- tags                text (JSON array) -- free-form seller tags
- description         text
- position            integer           -- display order, controlled from the panel
- created_at, updated_at                -- unix epoch

  indexes: unique(slug), index(position)
```

#### `vehicle_images`

```
- id                  integer, PK
- vehicle_id          integer, FK -> vehicles.id  ON DELETE CASCADE
- key                 text, nullable    -- R2 object key; null = placeholder art
- label               text
- width, height       integer           -- captured at upload, so no runtime probing
- position            integer           -- the first row is the cover

  index: (vehicle_id, position)
```

#### `login_attempts`

```
- id                  integer, PK
- ip                  text
- at                  integer           -- unix epoch

  index: (ip, at)
```

Failed logins only. Rows outside the 15-minute window are discarded during the
check itself, so there is no cleanup job.

### Relationships

```
vehicles (1) ──── (N) vehicle_images        [cascade delete]
```

## 💡 Challenges & Solutions

### Challenge 1: A secret leaked into the published bundle

**Problem:** an `ADMIN_PASSWORD` sitting in `.env.local` for local development was
compiled into the production bundle and shipped to the browser. The cause is a
precedence rule that is easy to miss: Next loads `.env.local` **during production
builds too**, and it outranks `.env.production`. Nothing warned about it — the
deploy succeeded, and the password was in the JavaScript.

**Solution:** make the mistake impossible to repeat, instead of remembering not to
repeat it. `.env` files may now contain `NEXT_PUBLIC_*` and nothing else, and a
guard enforces that before every build:

```ts
// scripts/check-env.ts — runs as part of pnpm cf:deploy
for (const file of [".env", ".env.local", ".env.production", ".env.development"]) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const key = line.trim().split("=")[0]?.trim();
    if (key && !key.startsWith("NEXT_PUBLIC_")) offenders.push({ file, key });
  }
}
if (offenders.length) process.exit(1); // fail the deploy instead of leaking
```

Secrets now travel through `wrangler secret put` (production) and `.dev.vars`
(local) — two channels the bundler never reads.

**Result:** a leaked credential became a class of bug the pipeline rejects, rather
than a rule in a document. The exposed password was rotated, and rotating
`ADMIN_SESSION_SECRET` alongside it dropped every open session.

### Challenge 2: Surviving a traffic flood on a free-tier budget

**Problem:** a public site eventually attracts scrapers and scanners. On
usage-billed infrastructure that is not just noise — it burns the D1 read quota
and R2 operation quota while the owner sleeps.

**Solution:** three layers, each cutting the request earlier than the last.

1. **Per-IP rate limiting in `middleware.ts`**, using Cloudflare's native rate
   limiting binding. The counter lives in datacenter memory, so it costs no
   database operation and needs no cleanup. Different parts of the site get their
   own budget, because their normal traffic shapes differ:

   | Path | Limit per IP | Reasoning |
   | --- | --- | --- |
   | Catalog and listing pages | 40 / 10 s | Normal browsing stays far below |
   | `/fotos/*` | 300 / 60 s | One page opens many photos at once |
   | `/admin`, `/api/admin` | 60 / 60 s | Room for an album upload, none for brute force |

   Over the limit returns `429` before any D1 query, R2 read, or render happens.
   Crucially, the limiter **fails open**: if the binding is missing or the counter
   errors, the request proceeds. A safety brake must never be the reason a site
   goes down.

2. **Edge caching on photo delivery.** Object keys carry a UUID and are therefore
   immutable, so responses are stored in `caches.default` with a one-year
   `immutable` header. A thousand people viewing the same car cost roughly one
   bucket read.

3. **A strict key format on the photo route.** It accepts only the exact shape the
   uploader writes:

   ```ts
   const OBJECT_KEY =
     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(thumb|full)\.webp$/;
   ```

   Without it, the route is a bucket-enumeration tool where every guess is a
   billable read.

**Result:** a flood is absorbed at the cheapest possible layer, and the failure
mode of an over-quota free plan is a temporary error page rather than a bill.

### Challenge 3: Instant filters that are still real URLs

**Problem:** filtering server-side means a round trip per click, which feels slow
on a phone in a dealership lot. Filtering purely client-side means the filtered
view has no URL — the seller cannot send *"here are all our Hondas under 80k"* on
WhatsApp, and Google cannot index it.

**Solution:** do both, from one source of truth. The server renders the catalog
already filtered by the query string; the browser then re-runs the same filter
functions locally and mirrors state back into the URL with `history.replaceState`:

```
/?marca=Honda&preco=80-120   →  server-rendered, indexable, shareable
click a chip                 →  filtered in place, 0 requests, URL updated
```

Because the catalog is around ten listings, shipping all of them once is cheaper
than one request per interaction. The filter logic lives in
[`src/lib/filters.ts`](src/lib/filters.ts) and is imported by both sides, so the
two paths cannot drift.

**Result:** zero-latency filtering with links that survive being pasted into a
chat — including a `/?etiqueta=Aceito%20troca` URL for every seller tag.

### Challenge 4: Uploading photos with no credentials and no size ceiling

**Problem:** the usual pattern — mint a pre-signed URL and let the browser upload
straight to the bucket — exists mostly to dodge a platform's request-body limit,
and it requires distributing storage credentials. Meanwhile a phone photo is 4–8 MB
and 4000 px wide, uploaded over dealership 4G, for a card that displays it at 640 px.

**Solution:** move the work to the client, and keep the credentials nowhere.

```ts
// src/lib/resize-image.ts — runs in the browser, before anything is sent
const full  = await toWebp(bitmap, VARIANT_WIDTH.full);   // 1600px — gallery, lightbox
const thumb = await toWebp(bitmap, VARIANT_WIDTH.thumb);  //  640px — cards, thumbnails
```

Both variants go in one POST to `/api/admin/fotos`, which writes them to R2 through
the Worker's binding — no access key exists in the application at all. Dimensions
are recorded at upload time, so nothing has to be probed at render time. Display
uses a plain `<img>`: the `next/image` optimizer does not run on Workers, and with
variants generated up front there is nothing left for it to do.

**Result:** a 3.8 MB photo becomes ~13 KB + ~4 KB, uploads are fast on a weak
connection, the bucket stays tiny, and the 4.5 MB body limit that forces the
pre-signed-URL dance elsewhere never applies.

### Challenge 5: The middleware that had to keep a deprecated name

**Problem:** Next 16 renamed `middleware.ts` to `proxy.ts` and marked the old name
deprecated. Renaming the file broke the build outright: any file named `proxy` is
compiled for the Node runtime, and `@opennextjs/cloudflare` 1.20 only accepts edge
middleware — `Node.js middleware is not currently supported`.

**Solution:** keep the deprecated name, and write down *why* directly above the
code, so the next person (including me, in six months) does not "fix" it:

```ts
// Why middleware.ts and not proxy.ts: Next 16 renamed the file and deprecated
// this name, but every file called `proxy` compiles to the Node runtime, and the
// Cloudflare adapter only accepts edge middleware — with proxy.ts the build
// fails immediately. When the adapter supports Node, rename the file and the
// function; nothing else changes.
```

**Result:** the rate limiting layer exists today instead of waiting on an upstream
release, and the migration path is a two-line change whenever the adapter catches
up. The same reasoning is applied elsewhere: `node-linker=hoisted` in `.npmrc` (the
OpenNext adapter rebuilds the dependency tree with symlinks, which Windows refuses
without Developer Mode) and the deliberate absence of a root `loading.tsx` (which,
combined with `force-dynamic` in 16.3.2, leaves the fallback stuck on screen) are
both documented at the point of the decision.

## 🔐 Security

- **JWT sessions** signed HS256 with `jose`, stored in an `HttpOnly`, `SameSite=Lax`,
  `Secure`-in-production cookie. Rotating `ADMIN_SESSION_SECRET` invalidates every
  session at once.
- **Constant-time password comparison.** A plain `===` returns on the first
  differing byte and leaks, through response timing, how much of the prefix was
  correct.
- **Brute-force lockout.** Ten failed attempts from one IP lock it for 15 minutes,
  tracked in `login_attempts` and keyed on `cf-connecting-ip`.
- **Server-side authorization on every write.** `requireSession()` runs before the
  database is touched, inside each server action — never in the component that
  renders the button.
- **No storage credentials in the application.** R2 is reached through a Worker
  binding; there is no access key to leak.
- **Bucket enumeration blocked** by the strict object-key pattern on the photo route.
- **Build-time secret guard** (`pnpm check:env`) fails the deploy if any
  non-`NEXT_PUBLIC_` variable appears in a `.env` file.
- **A dangerous action was deleted rather than hidden.** The design called for a
  "restore demo data" button in the panel, which wiped the catalog. Since every
  exported function in a `"use server"` file is a reachable endpoint, hiding the
  button would not have removed the endpoint — so the action was removed with it.

## 📊 Performance & Cost

| Aspect | Result |
| --- | --- |
| 🖼️ Photo payload | 3.8 MB phone photo → **~13 KB** (1600 px) + **~4 KB** (640 px) WebP |
| ⚡ Filtering | **0 network requests** per filter interaction |
| 🗄️ Repeat photo requests | Served from the datacenter cache — **~1 R2 read** regardless of viewers |
| 🚦 Flood handling | `429` returned **before** any D1 query, R2 read, or render |
| 💰 Monthly infrastructure cost | **R$ 0** — a domain (~R$ 40/year) is the only real expense |

**Free-tier headroom** (a 10-listing catalog uses a small fraction of each):

| Service | Free allowance | This project |
| --- | --- | --- |
| Workers | 100k requests/day | Well below |
| D1 | 5 GB, 5M reads/day | A few KB |
| R2 | 10 GB, free egress | ~20 KB per photo |

The tightest constraint is **10 ms of CPU per request** on the Workers free plan.
Observability is enabled, so CPU time is visible in the Cloudflare dashboard after
each deploy — the paid plan ($5/month) raises the ceiling to 30 s if a catalog ever
outgrows it.

## 📚 What I Learned

**Technical Skills**

- **An edge runtime is a different set of constraints, not a smaller Node.** No
  filesystem, no long-lived process, a hard CPU ceiling per request, and Web Crypto
  instead of `node:crypto`. Several defaults from the Next ecosystem — the image
  optimizer, Node middleware, signed-URL uploads — simply do not apply, and knowing
  *why* each one exists made replacing it straightforward.
- **Bindings versus credentials.** Reaching D1 and R2 through Worker bindings means
  there is no access key in the application to rotate, leak, or scope. It changed
  how I think about what a connection string is actually for.
- **Where to spend a request.** Shipping ten listings once and filtering locally
  beats a request per click; a UUID-keyed immutable cache turns a thousand photo
  views into one bucket read. Both are the same question — what does this
  interaction really have to cost?
- **Drizzle + D1 migrations.** A typed schema as the single source of truth, with
  additive migrations that never drop a column, so a deploy never breaks live
  listings.

**Best Practices**

- **Encode invariants in the pipeline, not in documentation.** The secret leak was
  fixed by a script that fails the build. A rule nobody can forget beats a rule
  written down.
- **Comment the decision, not the code.** The comments worth having here explain
  why a deprecated filename is correct, or why a flat `node_modules` is required —
  the things a reader would otherwise "fix" and break.
- **Treat every server action as a public endpoint.** UI-level hiding is not
  authorization, and an unused exported action is still a reachable one.
- **Design for the operator, not the developer.** Once friends started listing
  their vehicles here, "it works on my machine" stopped being good enough.
  [STARTUP.md](STARTUP.md) is written for someone who has never opened a terminal,
  and writing it exposed several places where the code quietly assumed things the
  person running it could not deliver.

## 🗺️ Roadmap

- [ ] Financing simulator on the listing page (down payment + installments)
- [ ] Per-listing view counters, so the seller can see what is getting attention
- [ ] Bulk photo reordering across multiple listings
- [ ] Automated tests: unit coverage for `filters.ts` and `vehicle-kind.ts`, plus an end-to-end pass over the admin flow
- [ ] Optional multi-seller mode (a real user table, replacing the single password)
- [ ] Orphan-photo cleanup for uploads abandoned in a cancelled form
- [ ] Migrate `middleware.ts` → `proxy.ts` once `@opennextjs/cloudflare` supports Node middleware

**Known limitations**

- Photos uploaded into a form that is then cancelled stay in the bucket. A few KB against a 10 GB allowance did not justify the reaping logic.
- Cloudflare WAF rules and Bot Fight Mode require a custom domain; on `*.workers.dev` only the in-Worker rate limiting applies.
- The free plan has no automated D1 restore — `wrangler d1 export` is the backup path, documented in [STARTUP.md](STARTUP.md).

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 👤 Contact

**Luan Henrique Neumann**

- 💼 LinkedIn: [luan-henrique-neumann-dev](https://www.linkedin.com/in/luan-henrique-neumann-dev)
- 🐱 GitHub: [@Luan-Neumann-Dev](https://github.com/Luan-Neumann-Dev)
- 📧 Email: luan.neumann.dev@gmail.com

---

<div align="center">

**⭐ Star this repository if you found it useful!**

Built with ☕ on Cloudflare's free tier.

</div>
