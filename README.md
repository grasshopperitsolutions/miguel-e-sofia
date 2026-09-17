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

## RSVP por WhatsApp (`final/` e raiz)

Os botões "VAMOS JOGAR" / "PASSAMOS A VEZ" abrem um link `wa.me` com uma mensagem pt-PT pré-preenchida (nome do(s) convidado(s), carta e sim/não) — sem servidor, sem chaves, nada para configurar. O número está em `var RSVP_WHATSAPP` no `<script>` (perto do topo). Para trocar o número, editar essa linha em `final/index.html` e em `index.html` (a raiz é uma cópia do conteúdo de `final/`).

*(Chegámos a montar um relay por email — primeiro Cloudflare Worker, depois função Vercel — mas o WhatsApp é mais simples: zero infraestrutura. O código do relay por Resend fica em `rsvp-worker/` caso um dia volte a fazer sentido, mas não está em uso.)*

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
