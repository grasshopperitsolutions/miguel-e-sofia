// M&S — O Jogo · RSVP relay
//
// Why this exists: GitHub Pages is static (no server), and Resend's API
// does not send CORS headers — the browser blocks a direct fetch() to
// api.resend.com no matter what the API key's permissions are (send-only
// or not; that's a key-scope setting, CORS is a separate browser rule).
// This tiny Cloudflare Worker is the smallest thing that can sit between
// the invite page and Resend: it holds the API key as a secret (never
// shipped to the browser) and adds the CORS headers the page needs.
//
// Deploy: see ../rsvp-worker/README.md

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method not allowed" }, 405, cors);
    }
    if (!env.RESEND_API_KEY || !env.TO_EMAIL) {
      return json({ ok: false, error: "worker not configured (missing RESEND_API_KEY / TO_EMAIL secrets)" }, 500, cors);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: "bad json" }, 400, cors);
    }

    const names = typeof data.names === "string" ? data.names.trim().slice(0, 300) : "";
    const card = typeof data.card === "string" ? data.card.slice(0, 40) : "";
    const attending = data.attending === "yes" ? "yes" : data.attending === "no" ? "no" : "";
    const notes = typeof data.notes === "string" ? data.notes.trim().slice(0, 1000) : "";
    if (!names || !attending) {
      return json({ ok: false, error: "missing names/attending" }, 400, cors);
    }

    const attendLabel = attending === "yes" ? "VAI JOGAR 🎲" : "PASSA A VEZ 🏳";
    const subject = `RSVP · ${names} · ${attendLabel}`;
    const html = `
      <div style="font-family:Georgia,serif;color:#241d17">
        <h2 style="color:#8a2a1c">Novo RSVP — M&amp;S, O Jogo</h2>
        <p><b>Jogador(es):</b> ${esc(names)}</p>
        <p><b>Carta:</b> ${esc(card || "—")}</p>
        <p><b>Resposta:</b> ${attendLabel}</p>
        ${notes ? `<p><b>Notas:</b><br>${esc(notes).replace(/\n/g, "<br>")}</p>` : ""}
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "M&S — O Jogo <onboarding@resend.dev>",
        to: [env.TO_EMAIL],
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return json({ ok: false, error: `resend ${r.status}: ${errText.slice(0, 300)}` }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
