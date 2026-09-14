// M&S — O Jogo · RSVP relay (Vercel serverless function)
//
// Same job as rsvp-worker/ (Cloudflare), for the Vercel-hosted deploy of
// this site: the static page can't hold a secret, and Resend's API sends
// no CORS headers, so the browser can never call api.resend.com directly —
// this function holds RESEND_API_KEY server-side and relays the request.
//
// Env vars to set in Vercel (Project → Settings → Environment Variables):
//   RESEND_API_KEY   required — your Resend send-only key
//   TO_EMAIL         required — the couple's inbox that receives every RSVP
//   FROM_EMAIL       optional — defaults to Resend's shared test sender,
//                     which needs no domain verification since every RSVP
//                     goes to one fixed, already-verified-by-owner inbox
//   ALLOWED_ORIGIN   optional — defaults to "*"

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method not allowed" });
  if (!process.env.RESEND_API_KEY || !process.env.TO_EMAIL) {
    return res.status(500).json({ ok: false, error: "function not configured (missing RESEND_API_KEY / TO_EMAIL)" });
  }

  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  var names = typeof body.names === "string" ? body.names.trim().slice(0, 300) : "";
  var card = typeof body.card === "string" ? body.card.slice(0, 40) : "";
  var attending = body.attending === "yes" ? "yes" : body.attending === "no" ? "no" : "";
  var notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  if (!names || !attending) return res.status(400).json({ ok: false, error: "missing names/attending" });

  var attendLabel = attending === "yes" ? "VAI JOGAR 🎲" : "PASSA A VEZ 🏳";
  var subject = "RSVP · " + names + " · " + attendLabel;
  var html =
    '<div style="font-family:Georgia,serif;color:#241d17">' +
    '<h2 style="color:#8a2a1c">Novo RSVP — M&amp;S, O Jogo</h2>' +
    "<p><b>Jogador(es):</b> " + esc(names) + "</p>" +
    "<p><b>Carta:</b> " + esc(card || "—") + "</p>" +
    "<p><b>Resposta:</b> " + attendLabel + "</p>" +
    (notes ? "<p><b>Notas:</b><br>" + esc(notes).replace(/\n/g, "<br>") + "</p>" : "") +
    "</div>";

  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "M&S — O Jogo <onboarding@resend.dev>",
        to: [process.env.TO_EMAIL],
        subject: subject,
        html: html,
      }),
    });
    if (!r.ok) {
      var errText = await r.text().catch(function () { return ""; });
      return res.status(502).json({ ok: false, error: "resend " + r.status + ": " + errText.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e && e.message || e) });
  }
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
