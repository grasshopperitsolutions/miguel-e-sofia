# M&S — O Jogo — project notes for Claude

Board-game-themed wedding invitation for Miguel Comba & Sofia Moreira (12 June
2027). Single self-contained `index.html` — no build step, no framework,
CSS+JS inline, hosted on plain GitHub Pages. See `README.md` for the
guest-list/RSVP/hosting details; this file is about the **two-site setup**.

## Two sites, one codebase

| Path | Purpose | Live at |
|---|---|---|
| `index.html` (root) | The real invite the couple's guests use | `.../miguel-e-sofia/` |
| `fake/index.html` | Portfolio demo — same site, fake guests | `.../miguel-e-sofia/fake/` |

`fake/index.html` is **not a symlink or a build output** — it's a real
duplicate file. GitHub Pages serves plain files with no templating, so this
is the simplest way to publish two variants without a build step. It isn't a
symlink to the same bytes either: relative asset paths resolve against the
*page's URL*, not the file's location on disk, so a byte-identical file
served from two different paths would need different `./assets/` prefixes
anyway — a real duplicate sidesteps that.

**The two files must stay byte-identical except for:**
1. Relative path prefixes — root uses `./assets/` and `fonts/...`; `fake/`
   uses `../assets/` and `../fonts/...` (both point at the *same* shared
   `assets/` and `fonts/` folders at the project root — nothing is
   duplicated there).
2. The `<script id="guests" type="application/json">…</script>` payload —
   root has the real guest list (not committed in full context here, comes
   from `OG_Assets/Nomes.xlsx` via `scripts/parse_names.py`); `fake/` has a
   made-up list of common American names (source: `scripts/fake_guests.json`,
   committed and tracked — unlike the real list, there's nothing private
   about the fake one). Two of the fake guests are named "Nuno" on purpose,
   to match the placeholder text `O teu nome (ex.: Nuno)` and demonstrate
   the disambiguation flow.

**When you change anything else — copy, CSS, JS, timing, new features —
apply it to both `index.html` and `fake/index.html`.** The fastest safe way:
make the edit in `index.html` first, verify it, then regenerate `fake/`:

```bash
sed -e "s#\./assets/#../assets/#g" -e "s#'fonts/#'../fonts/#g" -e "s#, fonts/#, ../fonts/#g" index.html > /tmp/fake_new.html
python3 -c "
import json, re
data = json.load(open('scripts/fake_guests.json', encoding='utf-8'))
compact = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
html = open('/tmp/fake_new.html', encoding='utf-8').read()
pattern = re.compile(r'(<script id=\"guests\" type=\"application/json\">)(.*?)(</script>)', re.S)
html, n = pattern.subn(lambda m: m.group(1) + compact + m.group(3), html)
assert n == 1
open('fake/index.html', 'w', encoding='utf-8').write(html)
"
```

Then confirm nothing else drifted. **Use Python for this, not shell `diff`**
— both files are mostly a handful of extremely long minified lines (one CSS
line, one JS line, etc.), and shell `diff`/process-substitution in this repo's
environment has been seen to spuriously report the entire file as different
when only one long line actually changed. Compare line-by-line instead:

```bash
python3 -c "
a = open('index.html', encoding='utf-8').readlines()
b = open('fake/index.html', encoding='utf-8').read()
b = b.replace('../assets/', './assets/').replace(\"'../fonts/\", \"'fonts/\").replace(', ../fonts/', ', fonts/')
b = b.splitlines(keepends=True)
diffs = [i for i,(x,y) in enumerate(zip(a,b)) if x!=y]
print('differing line numbers (0-indexed):', diffs)
"
```

Expect exactly 3 lines back: the two font-path comment lines near the top
(cosmetic only — `fonts/...` vs `../fonts/...` inside an HTML comment) and
the `<script id="guests">` line. Anything else means a real edit didn't make
it into `fake/index.html` — go apply it.

## Known caveat: RSVP shares the real WhatsApp number

`RSVP_WHATSAPP` in both files is the couple's real number (see README). The
portfolio/demo site currently points at the **same** number — if someone
plays with the fake site and taps "CONTA COMIGO"/"CONTA CONNOSCO", it opens
a WhatsApp chat to the real couple. This was flagged, not silently fixed —
swap it for a placeholder/demo number in `fake/index.html` before pointing
real portfolio traffic at it, or leave it if that's acceptable.

## Promo badge (both sites)

The floating circular badge (top-right, `#promo`) advertises Grasshopper
Solutions and links to grasshoppersolutions.online. Icon is
`assets/grasshopper-logo.svg`, pulled from the
`grasshopperitsolutions/landing-page` GitHub repo
(`assets/grasshopper-geometric-logo.svg`). It's part of the shared template,
so it appears on both the real invite and the fake demo.
