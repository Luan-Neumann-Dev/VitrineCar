# STARTUP — colocar a Vitrine no ar

Guia operacional do projeto: como publicar na Cloudflare, como rodar na sua
máquina e o que fazer quando algo quebra. Para entender **como o projeto é feito
por dentro** (arquitetura, decisões técnicas, schema), veja o
[README](README.md).

Se você nunca mexeu na Cloudflare, siga na ordem. São uns 20 minutos.

---

# Colocar no ar — passo a passo

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

Os textos e o telefone da loja vêm de variáveis `NEXT_PUBLIC_*`, lidas **na hora
de publicar**. Há três arquivos, com precedência crescente:

| Arquivo | Versionado? | Para quê |
| --- | --- | --- |
| [.env](.env) | sim | Valores de exemplo, que vêm com o repositório |
| [.env.production](.env.production) | sim | Só o que muda em produção: endereço do site e domínio das fotos |
| `.env.local` | **não** (Git ignora) | Os dados reais da sua loja — vence os dois de cima |

Como o repositório é público, **os dados reais da loja vão no `.env.local`**, que
não é versionado. Crie o arquivo na raiz do projeto:

```
NEXT_PUBLIC_STORE_NAME="Almeida Veículos"
NEXT_PUBLIC_STORE_TAGLINE="Veículos seminovos · Campinas, SP"
NEXT_PUBLIC_STORE_NOTE="Atendimento por WhatsApp"
NEXT_PUBLIC_WHATSAPP_NUMBER="5519998877665"
```

E ajuste o `NEXT_PUBLIC_SITE_URL` no `.env.production` para o endereço que o
passo 6 imprimiu (ou o seu domínio, se fez o passo 7):

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

Se a mudança mexeu no banco (arquivo novo dentro de `migrations/`), aplique a
migração **antes** de publicar — o código novo espera as colunas novas:

```bash
pnpm db:migrate:remote
```

As migrações só adicionam coisas, nunca apagam: os anúncios que já estão no ar
continuam do jeito que estão, e as colunas novas entram com valor padrão.

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

## Segurar uma enxurrada de requisições

Um site aberto na internet cedo ou tarde leva rajada — robô de varredura,
raspador de anúncio, alguém com um script. Como a Cloudflare cobra (ou corta)
por uso, uma rajada dessas queima franquia enquanto você dorme. A proteção vem
em duas camadas, e as duas precisam estar de pé.

### Camada 1 — já vem no código: freio por IP

O arquivo `src/middleware.ts` conta as requisições de cada IP e devolve
**429** para quem passa do teto, **antes** de consultar o banco, ler o bucket ou
montar a página. Os tetos ficam no `wrangler.jsonc`:

| Parte do site | Teto por IP | Por que esse número |
| --- | --- | --- |
| Vitrine e páginas de veículo | 40 a cada 10 s | Navegação normal fica bem abaixo |
| Fotos (`/fotos/...`) | 300 por minuto | Uma página abre várias fotos de uma vez |
| Painel e upload (`/admin`) | 60 por minuto | Cabe enviar um álbum, não cabe força bruta |

Para mudar qualquer um deles, edite o número em `wrangler.jsonc` e publique. O
período aceita só dois valores: `10` ou `60` segundos.

Junto com isso:

- **As fotos ficam em cache no datacenter.** A partir do segundo pedido a mesma
  foto sai do cache sem tocar no R2 — mil pessoas vendo o mesmo carro gastam
  praticamente uma leitura de bucket.
- **A rota das fotos só aceita o formato exato de chave que o upload grava.**
  Sem isso, dá para usar a rota para varrer o bucket, e cada tentativa seria uma
  operação cobrada.
- **O login continua travando o IP por 15 minutos** depois de dez senhas erradas.

Para conferir que o freio está valendo depois de publicar:

```bash
for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code} " https://seu-site/; done
```

Os primeiros respondem `200` e os últimos `429`.

### Camada 2 — na Cloudflare: o que só ela consegue barrar

O freio acima roda **dentro** do Worker. Ou seja: ele economiza banco, bucket e
processamento, mas cada requisição barrada ainda conta como uma requisição do
Worker. Quem corta antes disso é só a própria Cloudflare, no painel dela.

> **Isso exige o domínio próprio do passo 7.** Em `*.workers.dev` as regras de
> segurança da Cloudflare não se aplicam — o endereço não passa pela camada
> que as executa. Enquanto o site estiver só no `workers.dev`, você tem a
> camada 1 e o teto do plano, nada além.

No painel da Cloudflare, com o domínio já apontado (os nomes de menu mudam de
tempos em tempos, mas os caminhos são estes):

1. **Regra de limite de taxa** — seu domínio → **Security** → **WAF** →
   **Rate limiting rules**. Crie uma regra que bloqueie por IP acima de, por
   exemplo, 100 requisições em 10 segundos. O plano grátis dá uma regra, e ela
   é o único jeito de a rajada morrer sem custar requisição de Worker.
2. **Bot Fight Mode** — seu domínio → **Security** → **Bots**. Liga com um
   clique, também no grátis, e derruba boa parte dos raspadores automatizados.
3. **Avisos de uso** — **Manage Account** → **Notifications** → **Add**.
   Cadastre alerta de uso/cobrança no seu e-mail. É o que faz você descobrir a
   rajada no mesmo dia em vez de no fim do mês.

### E se estourar mesmo assim

Depende do plano, e a diferença importa:

- **Plano grátis:** o teto de 100 mil requisições/dia é duro. Ao bater, o site
  passa a responder erro 1015 até a virada do dia. Chato, mas **não gera conta
  nenhuma** — nesse plano não existe risco financeiro.
- **Plano pago (US$ 5/mês):** não tem teto automático; o que passar da franquia
  vira cobrança. Aqui os avisos do item 3 deixam de ser opcionais. Vale também
  limitar o CPU por requisição, acrescentando ao `wrangler.jsonc` (essa chave
  **só** funciona no plano pago — no grátis o deploy recusa):

  ```jsonc
  "limits": { "cpu_ms": 500 }
  ```

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

**O site respondeu "Muitas requisições em pouco tempo"**
É o freio por IP de `src/middleware.ts` fazendo o trabalho dele. Passa sozinho
em até um minuto. Se acontecer com visitante de verdade, os tetos estão apertados
demais — suba os números em `wrangler.jsonc` e publique. Ver
[Segurar uma enxurrada de requisições](#segurar-uma-enxurrada-de-requisições).

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

Gere também os tipos dos bindings (banco, bucket, limitadores). O arquivo é
gerado, não vai para o Git, e precisa ser refeito toda vez que o
`wrangler.jsonc` mudar:

```bash
pnpm cf:typegen
```

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

# Variáveis de ambiente

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
e por isso o `.env` e o `.env.production` são versionados — com valores de exemplo. Os
dados reais da loja ficam no `.env.local`, que o Git ignora.

As duas últimas **nunca** entram em arquivo `.env`: vão por `wrangler secret put`
em produção e por `.dev.vars` no local. O `pnpm check:env` derruba o build se
alguma escapar.
