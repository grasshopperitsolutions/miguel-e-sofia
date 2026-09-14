# M&S — O Jogo · Convite de casamento Miguel & Sofia

Convite digital de casamento com tema de jogo de tabuleiro.
Miguel Comba & Sofia Moreira · 12 de Junho de 2027 · São João das Lampas.

## Estrutura

| Caminho        | O que é                                                                 |
|----------------|------------------------------------------------------------------------|
| `index.html`   | Página de entrada — deixa o convidado escolher a edição                |
| `final/`       | **Edição Final** (recomendada) — mecânica de cartas da Clássica + assets originais + cada convidado procura o nome e recebe a **sua carta de jogar** (de `OG_Assets/Nomes.xlsx`) |
| `classic/`     | **Edição Clássica** — reprodução fiel do convite original (`.ppsx`/vídeo): cortina → envelope + selo → cartas do baralho uma a uma |
| `deluxe/`      | **Edição Deluxe** — versão criativa: a "caixa do jogo" completa em scroll, com mais animações e elementos de jogos populares |
| `404.html`     | Página de erro                                                         |
| `OG_Assets/`   | Material de origem (`.ppsx`, vídeo, JPEGs, `Nomes.xlsx`). **Fora do git** (`.gitignore`) — grande e contém a lista de convidados em bruto. |

Cada app é **um único ficheiro HTML** autónomo (CSS + JS inline, foto do casal e mapa embutidos em base64). Não há passo de build nem dependências — abre em qualquer browser, funciona offline.

## Lista de convidados

**`final/`** — os dados vêm de `OG_Assets/Nomes.xlsx` (coluna `Name` + coluna `Carta`). São processados por `scripts/parse_names.py` e o JSON resultante está **embutido** em `final/index.html` na tag `<script id="guests">`.

- Cada grupo = uma "party" (um casal/família que partilha a mesma carta, ex.: `J♠` = Nuno Moreira + Moni). `+1/+2` = acompanhantes na mesma carta.
- A procura aceita o primeiro nome ou o apelido; se houver mais do que uma party possível, mostra os nomes completos para escolher. Procurar qualquer membro da party dá o mesmo resultado.
- Sem carta / não encontrado → **JOKER** + "contactar os noivos".
- Para re-gerar após editar o Excel: `python scripts/parse_names.py` → copiar `guests.min.json` para a tag `<script id="guests">`.

**`classic/` e `deluxe/`** — lista fixa na constante `GUESTS` no fim do `<script>`.

- Os botões de RSVP abrem um email (`mailto:`) **sem destinatário** — preencher com o email dos noivos (procurar `var MAILTO` / `var mailto`).

## RSVP por email (`final/`)

Os botões "VAMOS JOGAR" / "PASSAMOS A VEZ" em `final/` chamam `api/rsvp.js` (`RSVP_ENDPOINT = "/api/rsvp"`, mesmo domínio) que envia por **Resend**. Se essa chamada falhar por algum motivo, cai automaticamente para `mailto:`.

O Resend não pode ser chamado diretamente do browser (não envia headers CORS — bloqueado independentemente do scope da API key), daí a função. Precisa de duas environment variables no projeto Vercel — ver secção seguinte. Existe também `rsvp-worker/`, a mesma função como Cloudflare Worker (alternativa caso o site volte a correr fora da Vercel); não está em uso enquanto `RSVP_ENDPOINT` apontar para `/api/rsvp`.

## Hosting — Vercel

O repositório é **privado** e está ligado a um projeto Vercel (`grasshopperitsolutions/miguel-e-sofia`, equipa `Grasshopper 's projects`, plano Pro) via a GitHub App da Vercel. Cada push a `main` faz deploy automático — sem build, sem workflow do GitHub Actions (o antigo `.github/workflows/deploy.yml` de GitHub Pages foi removido; Pages não publica a partir de repos privados em contas gratuitas).

**Environment variables a configurar no dashboard da Vercel** (Project → Settings → Environment Variables), para o RSVP funcionar:

| Nome | Obrigatória | Valor |
|---|---|---|
| `RESEND_API_KEY` | sim | a tua key da Resend (send-only) |
| `TO_EMAIL` | sim | o email que deve receber cada RSVP |
| `FROM_EMAIL` | não | por omissão usa `onboarding@resend.dev` — funciona sem verificar domínio, porque todos os RSVP vão para um único destinatário fixo (o dono da conta Resend) |
| `ALLOWED_ORIGIN` | não | por omissão `*`; só importa se `api/rsvp.js` for chamado a partir de outro domínio |

Depois de adicionar/alterar variáveis, é preciso um **redeploy** (novo push, ou "Redeploy" no dashboard) para entrarem em vigor.

**Proteção de acesso**: por omissão a Vercel protege os deploys de repos privados com Vercel Authentication (só quem tem login na equipa consegue abrir o URL) — foi **desativada** neste projeto para o convite ficar acessível a qualquer convidado com o link. Se no futuro quiseres um site realmente privado (não só o código), ativa Password Protection ou Vercel Authentication em Project → Settings → Deployment Protection.

### Domínio próprio (opcional)

Project → Settings → Domains, na Vercel. SSL é automático.

## Desenvolvimento local

Abrir `index.html` diretamente no browser, ou servir a pasta:

```bash
npx serve .
```

Isto serve os ficheiros estáticos mas não `api/rsvp.js` (só existe como Vercel Function). Para testar o RSVP localmente: `npx vercel dev` (pede login Vercel; lê as environment variables do projeto ligado).
