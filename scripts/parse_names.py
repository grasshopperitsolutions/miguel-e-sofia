# -*- coding: utf-8 -*-
import json, re, unicodedata
import openpyxl

SRC = r"OG_Assets/Nomes.xlsx"
OUT = r"guests.json"

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["Folha1"]
rows = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    if row[0] is None:
        continue
    rows.append((str(row[0]), None if row[1] is None else str(row[1])))


def norm(s):
    s = unicodedata.normalize("NFD", s.replace("\xa0", " "))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip().lower()


ALIAS = re.compile(r"\((ti[ao]|prim[ao]|dona|av[oô])\s+[A-Za-z\u00c0-\u00ff]+\)", re.I)
TRAIL_REL = re.compile(r"[\s,-]+(wife|husband|gf|bf|girlfriend|boyfriend|esposa|marido|mulher|namorad[ao]|son|daughter|dauther|filh[oa])\s*$", re.I)
AFTER_NAME = re.compile(r"\)\s*(?:wife|husband|son|daughter|dauther)\s+([A-Z\u00c0-\u00dd][\w\u00c0-\u00ff'-]+)", re.I)


def clean_display(raw):
    s = re.sub(r"\s+", " ", raw.replace("\xa0", " ")).strip()
    s = re.sub(r"\bM[\u00aa\u1d43a]\b\.?", "Maria", s)

    alias = None
    am = ALIAS.search(s)
    if am:
        alias = re.sub(r"\s+", " ", am.group(0).strip("()")).title()

    after = AFTER_NAME.search(s)

    head = s.split("(")[0]
    head = re.split(r"['\u2019]s\b", head)[0]
    prev = None
    while prev != head:
        prev = head
        head = TRAIL_REL.sub("", head).strip(" ,-")
    head = re.sub(r"\s+", " ", head).strip()

    if after:
        return after.group(1), alias
    if len(head) >= 2:
        return head, alias
    return "Acompanhante", alias


def parse_card(code):
    if not code:
        return None, None, 0
    code = code.split("\n")[0].strip()
    m = re.match(r"^JOKER(?:\+(\d+))?$", code, re.I)
    if m:
        return "JOKER", None, int(m.group(1) or 0)
    m = re.match(r"^(10|[2-9]|[AJQK])\s*([\u2660\u2665\u2666\u2663])(?:\+(\d+))?$", code)
    if m:
        return m.group(1), m.group(2), int(m.group(3) or 0)
    return None, None, 0


groups = []
last_by_base = {}


def new_group(base, rank, suit):
    g = {"base": base, "rank": rank, "suit": suit, "members": []}
    groups.append(g)
    if base:
        last_by_base[base] = g
    return g


for raw, code in rows:
    disp, alias = clean_display(raw)
    rawn = re.sub(r"\s+", " ", raw.replace("\xa0", " ")).strip()
    member = {"name": disp, "raw": rawn, "plus": 0}
    if alias:
        member["alias"] = alias
    rank, suit, plus = parse_card(code)
    member["plus"] = plus

    if rank is None:
        g = None
        mref = re.search(r"\(\s*([^()'\u2019]+?)['\u2019]s", raw)
        if mref:
            rn = norm(mref.group(1))
            for cand in groups:
                if any(rn in norm(mm["raw"]) for mm in cand["members"]):
                    g = cand
                    break
        if g is None:
            g = new_group(None, "JOKER", None)
            g["nocard"] = True
        g["members"].append(member)
        continue

    base = "JOKER" if rank == "JOKER" else rank + suit
    if plus > 0:
        (last_by_base.get(base) or new_group(base, rank, suit))["members"].append(member)
    else:
        new_group(base, rank, suit)["members"].append(member)

# merge non-JOKER groups sharing a card
seen = {}
final = []
for g in groups:
    k = g["base"]
    if k and k != "JOKER" and k in seen:
        seen[k]["members"].extend(g["members"])
    else:
        final.append(g)
        if k:
            seen[k] = g
groups = final

STOP = {"de", "da", "do", "e", "gf", "bf", "the", "tia", "tio", "acompanhante", "cgd", "bdp", "msc", "dep", "rpg", "wife", "son"}
out = []
for g in groups:
    g["members"].sort(key=lambda m: m["plus"])
    # dedup identical display names within a group
    used = set()
    for m in g["members"]:
        n = norm(m["name"])
        if n in used and n != "acompanhante":
            m["name"] = "Acompanhante"
        used.add(n)
    toks = set()
    for m in g["members"]:
        for t in re.findall(r"[a-z0-9]+", norm(m["name"]) + " " + norm(m["raw"])):
            if len(t) >= 2 and t not in STOP:
                toks.add(t)
    out.append({
        "rank": g["rank"], "suit": g["suit"],
        "joker": g["rank"] == "JOKER", "nocard": bool(g.get("nocard")),
        "names": [m["name"] for m in g["members"]],
        "aliases": [m.get("alias") for m in g["members"] if m.get("alias")],
        "q": sorted(toks),
    })

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
with open("guests.min.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print("-> guests.json / guests.min.json  (paste guests.min.json into <script id=\"guests\"> in final/index.html)")

print("groups:", len(out), " members:", sum(len(x["names"]) for x in out))
dupfirst = {}
for x in out:
    tag = ("JOKER" if x["joker"] else f'{x["rank"]}{x["suit"]}') + ("*" if x["nocard"] else "")
    al = ("  [" + ", ".join(x["aliases"]) + "]") if x["aliases"] else ""
    print(f'  {tag:7} {" & ".join(x["names"])}{al}')
