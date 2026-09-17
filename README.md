# M&S — O Jogo · Convite de casamento Miguel & Sofia

Convite digital de casamento com tema de jogo de tabuleiro.
Miguel Comba & Sofia Moreira · 6 de Junho de 2027 · São João das Lampas.

## Estrutura

| Caminho        | O que é                                                                 |
|----------------|------------------------------------------------------------------------|
| `index.html`   | O convite — página única, autónoma (CSS + JS inline). Não há passo de build nem dependências — abre em qualquer browser, funciona offline. |
| `assets/`      | Imagens do convite (fundo, selo, ícones extraídos, foto do casal, etc.) |
| `fonts/`       | `IM Fell English` (self-hosted, `@font-face` no `index.html`)          |
| `404.html`     | Página de erro                                                         |
| `OG_Assets/`   | Material de origem (`.ppsx`, vídeo, JPEGs, `Nomes.xlsx`). **Fora do git** (`.gitignore`) — grande e contém a lista de convidados em bruto. |

Havia três edições (Clássica, Deluxe, Final) durante o desenvolvimento — foram consolidadas numa só (a antiga "Final") para eliminar a duplicação de código entre a raiz e `final/`. O histórico das outras duas fica disponível no git caso valha a pena revisitá-las.

## Lista de convidados

Os dados vêm de `OG_Assets/Nomes.xlsx` (coluna `Name` + coluna `Carta`). São processados por `scripts/parse_names.py` e o JSON resultante está **embutido** em `index.html` na tag `<script id="guests">`.

- Cada grupo = uma "party" (um casal/família que partilha a mesma carta, ex.: `J♠` = Nuno Moreira + Moni). `+1/+2` = acompanhantes na mesma carta.
- A procura aceita o primeiro nome ou o apelido; se houver mais do que uma party possível, mostra os nomes completos para escolher. Procurar qualquer membro da party dá o mesmo resultado.
- Sem carta / não encontrado → **JOKER** + "contactar os noivos".
- Para re-gerar após editar o Excel: `python scripts/parse_names.py` → copiar `guests.min.json` para a tag `<script id="guests">`.

## RSVP por WhatsApp

Os botões "VAMOS JOGAR" / "PASSAMOS A VEZ" abrem um link `wa.me` com uma mensagem pt-PT pré-preenchida (nome do(s) convidado(s), carta e sim/não) — sem servidor, sem chaves, nada para configurar. O número está em `var RSVP_WHATSAPP` no `<script>` (perto do topo de `index.html`).

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
