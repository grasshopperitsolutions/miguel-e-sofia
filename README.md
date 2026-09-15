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

Os botões "VAMOS JOGAR" / "PASSAMOS A VEZ" em `final/` abrem um email (`mailto:`) **sem destinatário** — preencher com o email dos noivos (procurar `var MAILTO`).

Para RSVP por email de verdade (via **Resend**) sem servidor próprio: `rsvp-worker/` tem a mesma lógica como Cloudflare Worker (free tier). O Resend não pode ser chamado diretamente do browser (não envia headers CORS), daí precisar de um relay. Ver `rsvp-worker/README.md` para o deploy — depois só falta colar o URL do Worker em `var RSVP_ENDPOINT` no `final/index.html`. Não está em uso por omissão (`RSVP_ENDPOINT = ""`), os botões caem sempre para `mailto:`.

*(Já experimentámos alojar isto na Vercel com uma função equivalente — funcionava, mas o plano Pro só inclui um "deploying seat"; qualquer outra pessoa a fazer deploy precisa de lugar pago adicional. Voltámos ao GitHub Pages por isso.)*

## Hosting — GitHub Pages

Repositório **público** (GitHub Pages não publica a partir de repos privados em contas gratuitas).

**Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main` / `(root)`.** Não é preciso workflow do GitHub Actions nem build — o `.nojekyll` na raiz garante que os ficheiros são servidos tal como estão.

### Domínio próprio (opcional)

Adicionar um ficheiro `CNAME` na raiz com o domínio e configurar o DNS (registo `A`/`ALIAS` para o apex a apontar para os IPs do GitHub Pages, `CNAME` para subdomínios a apontar para `<org>.github.io`).

## Desenvolvimento local

Abrir `index.html` diretamente no browser, ou servir a pasta:

```bash
npx serve .
```
