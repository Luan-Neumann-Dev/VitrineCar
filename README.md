# Vitrine de Veículos

Catálogo de carros seminovos com contato direto por WhatsApp, e um painel em
`/admin` onde o vendedor cadastra os anúncios e sobe as fotos.

Roda inteiro na Cloudflare (Workers + D1 + R2), dentro do plano gratuito.

---

# Colocar no ar — passo a passo

Se você nunca mexeu na Cloudflare, siga na ordem. São uns 20 minutos.

## Antes de começar

Você precisa de:

- **Conta na Cloudflare** — grátis, em [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up). Não pede cartão.
- **Node.js 20 ou superior** e **pnpm** instalados.
- **Um domínio** (ex.: `almeidaveiculos.com.br`), se quiser endereço próprio. É opcional: dá para começar num endereço gratuito da Cloudflare e ligar o domínio depois.

Instale as dependências:

```bash
pnpm install
```

## 1. Conectar sua conta da Cloudflare

Isso abre o navegador para você autorizar:

```bash
npx wrangler login
```

## 2. Criar o banco de dados

```bash
pnpm cf:db:create
```

O comando devolve um bloco parecido com este:

```
[[d1_databases]]
binding = "DB"
database_name = "vitrine-carros"
database_id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"
```

**Copie o `database_id`** e cole no arquivo [wrangler.jsonc](wrangler.jsonc), no
lugar de `PREENCHER_APOS_wrangler_d1_create`. Sem isso, nada funciona.

## 3. Criar o bucket das fotos

```bash
pnpm cf:r2:create
```

> Se der erro pedindo para ativar o R2, entre em
> [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** e clique em ativar.
> É gratuito, mas a Cloudflare pede um cartão só para liberar o serviço — ele não
> é cobrado dentro do limite grátis.

## 4. Criar as tabelas

```bash
pnpm db:migrate:remote
```

## 5. Definir a senha do painel

São dois segredos. Eles **não** ficam em arquivo nenhum — vão direto para a
Cloudflare.

A senha que você vai digitar em `/admin`. Escolha uma boa, de 16 caracteres ou
mais — essa página fica aberta na internet:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

A chave que assina o cookie de quem está logado. Não é para você decorar, é para
o servidor usar:

```bash
npx wrangler secret put ADMIN_SESSION_SECRET
```

Para essa segunda, gere um valor aleatório e cole quando ele pedir:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 6. Primeiro deploy

```bash
pnpm cf:deploy
```

No final ele mostra o endereço, algo como
`https://vitrine-carros.SEU-NOME.workers.dev`. **Abra e confira que o site
carrega** — ainda sem anúncios, e com os dados de exemplo da loja.

## 7. Apontar o seu domínio

Pule este passo se for usar o endereço `.workers.dev` por enquanto.

Para usar domínio próprio, ele precisa estar **dentro da sua conta Cloudflare**:

1. No painel da Cloudflare, **Add a site**, digite seu domínio e escolha o plano Free.
2. A Cloudflare mostra dois **nameservers**. Entre no site onde você comprou o domínio (Registro.br, GoDaddy, etc.) e troque os nameservers por esses dois.
3. Espere a Cloudflare confirmar (de minutos a algumas horas).
4. Vá em **Workers & Pages** → `vitrine-carros` → **Settings** → **Domains & Routes** → **Add** → **Custom domain**, e informe seu domínio.

## 8. Colocar os dados reais da loja

Os dados ficam em dois arquivos, os dois versionados:

- **[.env](.env)** — o que vale em qualquer ambiente: nome, cidade, telefone.
- **[.env.production](.env.production)** — só o que muda em produção: o endereço
  do site e o domínio das fotos.

Ajuste o `NEXT_PUBLIC_SITE_URL` no `.env.production` para o endereço que o passo
6 imprimiu (ou o seu domínio, se fez o passo 7):

```
NEXT_PUBLIC_SITE_URL="https://vitrine-carros.SEU-NOME.workers.dev"
```

Dois cuidados:

- **`NEXT_PUBLIC_WHATSAPP_NUMBER`** vai com código do país e só números:
  `55` + DDD + telefone. Sem espaço, traço ou parênteses.
- **`NEXT_PUBLIC_SITE_URL`** vai com `https://` e **sem barra no fim**. É ele que
  entra no link que o Google indexa e na prévia que aparece quando alguém manda o
  anúncio no WhatsApp.

Publique de novo para os valores entrarem:

```bash
pnpm cf:deploy
```

> Esses valores são lidos **na hora de publicar**, não enquanto o site roda. Toda
> vez que mudar o telefone ou o nome da loja, precisa rodar `pnpm cf:deploy` de
> novo.

### ⚠ Nunca coloque senha em arquivo `.env`

Arquivos `.env` são compilados **para dentro** do bundle que vai ao ar. Pior: o
Next carrega o `.env.local` também no build de produção, e com precedência
**maior** que o `.env.production` — então um `ADMIN_PASSWORD` deixado ali para
desenvolvimento é publicado junto com o site.

A regra: arquivos `.env` só podem ter `NEXT_PUBLIC_*`. Segredo vai por
`wrangler secret put` (produção) e `.dev.vars` (local), que o build nunca lê.

Isso é verificado automaticamente antes de todo build — o `pnpm cf:deploy` roda
[scripts/check-env.ts](scripts/check-env.ts) e falha se achar qualquer variável
que não seja `NEXT_PUBLIC_*` nesses arquivos. Para checar sozinho:

```bash
pnpm check:env
```

## 9. Entrar no painel e cadastrar os carros

Abra `https://seu-site/admin`, entre com a senha do passo 5 e clique em **Novo
anúncio**.

O mínimo para publicar é **marca e modelo**. As fotos você arrasta para a área
pontilhada — elas são reduzidas no seu próprio navegador antes de subir, então
pode mandar as fotos originais do celular sem se preocupar com tamanho. A
primeira foto vira a capa; arraste as miniaturas para mudar a ordem.

> **Quer ver o site cheio antes de cadastrar os seus?** `pnpm db:seed:remote`
> coloca 12 carros de demonstração. **Cuidado:** esse comando apaga tudo que
> estiver lá. Use só antes de cadastrar os anúncios de verdade.

## 10. Domínio próprio para as fotos (opcional, recomendado depois)

Sem isso o site já funciona: as fotos são servidas pela aplicação. Mas colocá-las
num domínio próprio faz elas virem direto do CDN, o que é mais rápido e não gasta
requisição do Worker.

1. Painel da Cloudflare → **R2** → bucket `vitrine-carros-fotos` → **Settings** → **Public access** → **Connect Custom Domain**.
2. Use um subdomínio, por exemplo `fotos.almeidaveiculos.com.br`.
3. Coloque esse endereço no `.env.production`:

```
NEXT_PUBLIC_PHOTOS_BASE_URL="https://fotos.almeidaveiculos.com.br"
```

4. Publique de novo com `pnpm cf:deploy`.

As fotos que já estavam lá continuam funcionando — muda só por onde elas são
entregues.

---

# Depois que estiver no ar

## Publicar uma mudança no código

```bash
pnpm cf:deploy
```

## Trocar a senha do painel

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Vale na hora, sem republicar. Se desconfiar que alguém entrou, troque também o
`ADMIN_SESSION_SECRET` — isso derruba **todas** as sessões abertas.

## Aparecer no Google

Em [search.google.com/search-console](https://search.google.com/search-console),
cadastre seu domínio e envie o sitemap: `https://seu-site/sitemap.xml`.

Cada anúncio já publica os dados estruturados que fazem o carro aparecer na busca
**com preço e ano**, não só como um link.

## Backup do catálogo

```bash
npx wrangler d1 export vitrine-carros --remote --output=backup.sql
```

Vale rodar de vez em quando. O plano grátis não tem restauração automática.

---

# Custos

| Serviço | Limite gratuito | O que esse site usa |
| --- | --- | --- |
| Workers | 100 mil requisições/dia | Bem abaixo disso |
| D1 (banco) | 5 GB, 5 milhões de leituras/dia | Alguns KB |
| R2 (fotos) | 10 GB, download ilimitado | ~20 KB por foto |

Com 10 anúncios você não encosta em nenhum limite. O único custo real é o
domínio, uns R$ 40 por ano num `.com.br`.

**Um ponto para observar:** o plano gratuito do Workers dá **10 ms de CPU por
requisição**. Essas páginas costumam caber, mas é o limite mais apertado da
montagem. A observabilidade já está ligada — depois de publicar, olhe o *CPU
time* no painel da Cloudflare em **Workers & Pages** → `vitrine-carros`. Se
estourar com frequência, o plano pago são US$ 5/mês e sobe o limite para 30 s.

---

# Problemas comuns

**"Erro ao publicar: database_id inválido"**
Você pulou o passo 2. O `database_id` em `wrangler.jsonc` ainda está com o texto
`PREENCHER_APOS_wrangler_d1_create`.

**O site abre mas não aparece anúncio nenhum**
Faltou `pnpm db:migrate:remote` (passo 4), ou você ainda não cadastrou nada no
painel.

**Não consigo entrar em /admin**
Confirme que a senha foi gravada: `npx wrangler secret list`. Devem aparecer
`ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`. Depois de dez tentativas erradas o seu
IP fica travado por 15 minutos.

**O link no WhatsApp abre a conversa errada**
`NEXT_PUBLIC_WHATSAPP_NUMBER` está com formato errado. Só números, começando
com 55.

**O build falha com `EBUSY` ou `EPERM`**
Sobrou um servidor de teste rodando. No Windows:

```bash
taskkill /F /IM workerd.exe
```

---

# Rodando na sua máquina

Os dados da loja já vêm do `.env` versionado. Falta só criar o `.dev.vars`, que
guarda os segredos locais e **não** vai para o Git:

```
ADMIN_PASSWORD="qualquer-coisa-local"
ADMIN_SESSION_SECRET="qualquer-coisa-local"
```

Tanto o `pnpm dev` quanto o `pnpm cf:preview` leem daí — o `next dev` sobe um
runtime da Cloudflare por baixo, então os dois enxergam o mesmo arquivo. Nunca
coloque esses dois valores num `.env`.

Crie o banco local com os 12 exemplos:

```bash
pnpm db:reset:local
```

```bash
pnpm dev
```

> Se trocar o `database_id` no `wrangler.jsonc`, o banco local zera: o Miniflare
> guarda um banco separado por id. É só rodar `pnpm db:reset:local` de novo.

Para testar no runtime real da Cloudflare em vez do Node:

```bash
pnpm cf:preview
```

---

# Como funciona por dentro

## Stack

| Peça | O quê | Por quê |
| --- | --- | --- |
| Next.js 16 (App Router) | Aplicação | Rotas reais (`/veiculo/[slug]`), indexáveis |
| shadcn/ui + Tailwind 4 | Interface | O design já usa Geist, paleta zinc e raios 6/8px |
| Cloudflare Workers | Hospedagem | Grátis e sem restrição de uso comercial |
| D1 (SQLite) | Banco | Grátis; 10 anúncios não encostam nos limites |
| R2 | Fotos | Grátis, sem cobrança de download, CDN incluso |
| Drizzle ORM | Acesso ao banco | Trocar D1 por Postgres é mudar o driver, não as queries |

O código é agnóstico de infra de propósito: banco pelo Drizzle e fotos pela API
do R2. Se o adapter da Cloudflare atrapalhar, migrar para outro lugar é trocar o
driver e o comando de deploy — não uma reescrita.

## O catálogo

O servidor entrega os ~10 anúncios de uma vez e o filtro roda no navegador, com o
estado espelhado na URL por `history.replaceState`. O resultado é filtro
instantâneo (zero requisição por clique) sem abrir mão de link compartilhável:
`/?marca=Honda&preco=80-120` renderiza filtrado direto do servidor, então o
vendedor pode mandar esse link no WhatsApp e o Google consegue indexar.

## O painel

Sessão em JWT assinado, guardada num cookie `HttpOnly`. Toda escrita é uma server
action que chama `requireSession()` **antes de tocar no banco** — a proteção não
depende da interface esconder botão. Dez tentativas erradas travam o IP por 15
minutos (a contagem fica na tabela `login_attempts`), e a comparação da senha é
em tempo constante.

O painel não guarda cópia local do catálogo: cada ação grava no D1 e recarrega do
servidor. É um ida-e-volta a mais por clique, mas o que aparece na tela é sempre
o que está no banco.

## As fotos

1. O navegador redimensiona e converte para WebP **antes de enviar**, em dois
   tamanhos: 1600px (galeria e lightbox) e 640px (cards e miniaturas). Uma foto
   de 3,8 MB vira ~13 KB + ~4 KB.
2. Os dois arquivos vão num POST para `/api/admin/fotos`, que grava no R2 pelo
   binding do Worker.

Não usamos URL assinada: o Worker fala com o bucket por binding, sem credencial
nenhuma, e não existe aqui o limite de corpo de 4,5 MB que obrigaria a desviar do
servidor em outras hospedagens.

Para exibir, é `<img>` puro — o otimizador do `next/image` não roda no Workers, e
não haveria o que otimizar em runtime já que os tamanhos são gravados no upload.

Excluir um anúncio, ou tirar uma foto dele e salvar, apaga as duas variantes do
R2. Fotos enviadas num formulário que você cancelou ficam órfãs no bucket — são
alguns KB, e com 10 GB grátis não vale código para caçá-las.

## Decisões que valem saber

- **`node-linker=hoisted` no `.npmrc`** — o adapter do OpenNext recria a árvore
  de dependências com symlinks, e o Windows só permite isso com Modo
  Desenvolvedor ligado. Com `node_modules` plano o build passa em qualquer
  máquina. Não mexa nisso sem testar `pnpm cf:deploy`.
- **Sem `loading.tsx`** — no Next 16.3.2 um `loading.tsx` na raiz combinado com
  `dynamic = "force-dynamic"` deixa a fallback presa: o conteúdo real fica oculto
  no DOM e nunca entra. Como a consulta ao D1 responde junto com o HTML, não há
  espera para mostrar.
- **Preço é inteiro em reais** — carro não tem centavos, e assim não existe erro
  de arredondamento.
- **Não existe ação de "restaurar exemplos" no painel.** O design previa esse
  botão, mas ele apagava o catálogo inteiro. Toda função exportada de um arquivo
  `"use server"` vira um endpoint acessível, então a ação foi removida junto com
  o botão. Para recarregar os exemplos em desenvolvimento, use
  `pnpm db:reset:local`.

## Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `NEXT_PUBLIC_STORE_NAME` | Nome no cabeçalho, rodapé e mensagens do WhatsApp |
| `NEXT_PUBLIC_STORE_TAGLINE` | Linha abaixo do nome |
| `NEXT_PUBLIC_STORE_NOTE` | Linha livre no rodapé (horário, forma de atendimento…) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número com DDI, só dígitos (ex.: `5519998877665`) |
| `NEXT_PUBLIC_SITE_URL` | Domínio do site — canonical, sitemap e dados estruturados |
| `NEXT_PUBLIC_PHOTOS_BASE_URL` | Domínio público do bucket R2 (opcional) |
| `ADMIN_PASSWORD` | Senha do painel — **segredo**, nunca `NEXT_PUBLIC` |
| `ADMIN_SESSION_SECRET` | Chave que assina o cookie de sessão — **segredo** |

As `NEXT_PUBLIC_*` são lidas no build e aparecem no HTML — não há segredo nelas,
e por isso o `.env` e o `.env.production` são versionados.

As duas últimas **nunca** entram em arquivo `.env`: vão por `wrangler secret put`
em produção e por `.dev.vars` no local. O `pnpm check:env` derruba o build se
alguma escapar.
