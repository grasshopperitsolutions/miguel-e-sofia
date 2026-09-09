# M&S — O Jogo · Convite de casamento Miguel & Sofia

Convite digital de casamento com tema de jogo de tabuleiro.
Miguel Comba & Sofia Moreira · 12 de Junho de 2027 · São João das Lampas.

## Estrutura

| Caminho        | O que é                                                                 |
|----------------|------------------------------------------------------------------------|
| `index.html`   | Página de entrada — deixa o convidado escolher a edição                |
| `classic/`     | **Edição Clássica** — reprodução fiel do convite original (`.ppsx`/vídeo): cortina → envelope + selo → cartas do baralho uma a uma |
| `deluxe/`      | **Edição Deluxe** — versão criativa: a "caixa do jogo" completa em scroll, com mais animações e elementos de jogos populares |
| `404.html`     | Página de erro                                                         |

Cada app é **um único ficheiro HTML** autónomo (CSS + JS inline, foto do casal e mapa embutidos em base64). Não há passo de build nem dependências — abre em qualquer browser, funciona offline.

## Lista de convidados

Em `classic/index.html` e `deluxe/index.html`, no fim do `<script>`, a constante `GUESTS`:

```js
var GUESTS=[
  "Nuno Moreira","Mónica Mateos", /* ... */
];
```

- A procura aceita só o primeiro nome; pede o nome completo se houver mais do que um jogador com esse primeiro nome **ou** apelido.
- Nome não encontrado → mensagem + botão para contactar os noivos.
- Os botões de RSVP abrem um email (`mailto:`) **sem destinatário** — preencher com o email dos noivos:
  procurar `var MAILTO` / `var mailto` em cada ficheiro.
- Na Edição Clássica, o nome que aparece no primeiro cartão está em `var GUEST_NAME`.

## Hosting — GitHub Pages

O repositório ainda não existe. Para publicar:

```bash
# a partir desta pasta
git init -b main
git add .
git commit -m "Convite M&S — edições Clássica e Deluxe"

# criar o repo no GitHub (ex.: com o gh CLI)
gh repo create grasshopperitsolutions/miguel-e-sofia --private --source=. --remote=origin --push
```

Depois, no GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
O workflow `.github/workflows/deploy.yml` publica a pasta inteira a cada push para `main` (sem build).

O ficheiro `.nojekyll` está incluído para o Pages servir tudo tal como está.

### Domínio próprio (opcional)

Adicionar um ficheiro `CNAME` na raiz com o domínio (ex.: `convite.exemplo.pt`) e configurar o DNS.

## Desenvolvimento local

Abrir `index.html` diretamente no browser, ou servir a pasta:

```bash
npx serve .
```
