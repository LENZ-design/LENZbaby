/* =====================================================================
   LENZ baby – automatický e-mail po rezervácii torty
   Beží zadarmo v Google Apps Script pod účtom lenzbabyds@gmail.com.

   AKO TO ZAPNÚŤ (cca 5 minút, stačí raz):
   1. Prihláste sa do Gmailu lenzbabyds@gmail.com a otvorte https://script.google.com
   2. „Nový projekt“ → vymažte, čo tam je, a vložte celý tento súbor. Projekt pomenujte „LENZ baby rezervácie“.
   3. Hore v NASTAVENIACH doplňte presnú adresu vyzdvihnutia (ADRESA).
   4. Vyskúšajte: hore vyberte funkciu „testEmail“ → Spustiť. Google sa opýta na povolenie
      (posielať e-maily vo vašom mene) → Povoliť. Do schránky vám príde ukážkový e-mail.
   5. Vpravo hore „Nasadiť“ → „Nové nasadenie“ → typ „Webová aplikácia“
        Spustiť ako: Ja (lenzbabyds@gmail.com)
        Kto má prístup: Ktokoľvek
      → Nasadiť → skopírujte „URL webovej aplikácie“ (končí na /exec).
   6. Tú adresu vložte na webe do index.html do  CONFIG.formEndpoint: "https://script.google.com/macros/s/…/exec"
   Pri každej zmene tohto skriptu: „Nasadiť“ → „Spravovať nasadenia“ → upraviť → Verzia: Nová → Nasadiť
   (adresa ostane rovnaká).

   Limit Gmailu: cca 100 e-mailov denne, čo na rezervácie bohato stačí.
   ===================================================================== */

// ---------- NASTAVENIA ----------
const OBCHOD = {
  nazov: "LENZ baby",
  email: "lenzbabyds@gmail.com",      // sem príde kópia každej rezervácie a žiadosti
  telefon: "+421 917 154 016",
  instagram: "lenz_baby",
  web: "",                              // DOPLNIŤ po spustení webu, napr. "https://lenzbaby.sk"
  ADRESA: "",                           // DOPLNIŤ len v Google Apps Script: presná adresa vyzdvihnutia (len v e-maile, nikdy nie sem do repozitára)
  zrusenie: "Ak by ste tortu nakoniec nepotrebovali alebo chceli zmeniť termín, stačí nám zavolať alebo odpísať na tento e-mail."
};

// ---------- PRÍJEM Z WEBU ----------
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.typ === "rezervacia" && d.email) poslatZakaznikovi(d);
    poslatObchodu(d);
    return vystup({ ok: true });
  } catch (err) {
    console.error(err);
    return vystup({ ok: false, chyba: String(err) });
  }
}
function vystup(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- E-MAIL ZÁKAZNÍKOVI ----------
function poslatZakaznikovi(d) {
  const predmet = `Rezervácia torty ${d.tortaNazov} – vyzdvihnutie ${d.terminText}`;
  MailApp.sendEmail({
    to: d.email,
    subject: predmet,
    name: OBCHOD.nazov,
    replyTo: OBCHOD.email,
    body: textovaVerzia(d),
    htmlBody: htmlVerzia(d)
  });
}

function miestoText(d) {
  return OBCHOD.ADRESA ? OBCHOD.ADRESA : `${d.miesto || "Dunajská Streda"} – presnú adresu vám ešte pošleme.`;
}

function textovaVerzia(d) {
  return [
    `Dobrý deň, ${d.meno},`,
    ``,
    `ďakujeme za rezerváciu. Tortu ${d.tortaNazov} sme vám odložili a tešíme sa na stretnutie.`,
    ``,
    `VYZDVIHNUTIE`,
    `Kedy: ${d.terminText}, ${d.cas}`,
    `Kde: ${miestoText(d)}`,
    `Platba: ${d.platba || "Pri vyzdvihnutí."}`,
    `Cena: ${d.cenaText}${d.cenaRozpis ? ` (${d.cenaRozpis})` : ""}`,
    ``,
    `VAŠA TORTA: ${d.tortaNazov}`,
    ...(d.obsah || []).map(x => `– ${x}`),
    d.menoNaTorte ? `Meno na torte: ${d.menoNaTorte} (+${d.menoPriplatok})` : ``,
    d.poznamka ? `\nVaša poznámka: ${d.poznamka}` : ``,
    ``,
    OBCHOD.zrusenie,
    ``,
    `S láskou`,
    `${OBCHOD.nazov}`,
    `${OBCHOD.telefon} · ${OBCHOD.email} · instagram.com/${OBCHOD.instagram}`
  ].join("\n");
}

function htmlVerzia(d) {
  const h = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const riadok = (k, v) => `<tr><td style="padding:8px 0;color:#76665D;width:110px;vertical-align:top">${k}</td><td style="padding:8px 0;font-weight:700;color:#3A2E28">${v}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#FFFBF8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#3A2E28">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF8;padding:24px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #F3E6DC;border-radius:24px">
      <tr><td style="padding:28px 28px 8px;text-align:center">
        <div style="font-size:26px;font-weight:800;letter-spacing:4px;color:#E8876C">LENZ</div>
        <div style="font-size:18px;color:#76665D;margin-top:-4px">baby</div>
      </td></tr>
      <tr><td style="padding:8px 28px 0">
        <h1 style="font-size:22px;line-height:1.3;margin:12px 0 8px">Ďakujeme, tortu máte rezervovanú</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px">Dobrý deň, ${h(d.meno)},<br>tortu <b>${h(d.tortaNazov)}</b> sme vám odložili a tešíme sa na stretnutie.</p>
      </td></tr>
      <tr><td style="padding:0 28px">
        <div style="background:#FFEDE4;border-radius:18px;padding:16px 20px">
          <div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#76665D;text-transform:uppercase">Vyzdvihnutie</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin-top:6px">
            ${riadok("Kedy", `${h(d.terminText)}, ${h(d.cas)}`)}
            ${riadok("Kde", h(miestoText(d)))}
            ${riadok("Platba", h(d.platba || "Pri vyzdvihnutí."))}
            ${riadok("Cena", h(d.cenaText) + (d.cenaRozpis ? `<br><span style="font-weight:400;color:#76665D;font-size:13px">${h(d.cenaRozpis)}</span>` : ""))}
          </table>
        </div>
      </td></tr>
      <tr><td style="padding:20px 28px 0">
        <div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#76665D;text-transform:uppercase">Vaša torta</div>
        <p style="font-size:17px;font-weight:800;margin:6px 0 4px">${h(d.tortaNazov)}</p>
        <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.7;color:#3A2E28">${(d.obsah || []).map(x => `<li>${h(x)}</li>`).join("")}</ul>
        ${d.menoNaTorte ? `<p style="font-size:15px;margin:12px 0 0"><span style="color:#76665D">Meno na torte:</span> <b>${h(d.menoNaTorte)}</b> (+${h(d.menoPriplatok)})</p>` : ""}
        ${d.poznamka ? `<p style="font-size:15px;margin:12px 0 0"><span style="color:#76665D">Vaša poznámka:</span> ${h(d.poznamka)}</p>` : ""}
      </td></tr>
      <tr><td style="padding:20px 28px 0">
        <p style="font-size:15px;line-height:1.6;color:#76665D;margin:0">${h(OBCHOD.zrusenie)}</p>
      </td></tr>
      <tr><td style="padding:24px 28px 28px">
        <p style="font-size:16px;margin:0">S láskou<br><b>${h(OBCHOD.nazov)}</b></p>
        <p style="font-size:14px;color:#76665D;margin:10px 0 0;line-height:1.7">
          ${h(OBCHOD.telefon)}<br>
          <a href="mailto:${h(OBCHOD.email)}" style="color:#C9654D">${h(OBCHOD.email)}</a><br>
          <a href="https://www.instagram.com/${h(OBCHOD.instagram)}/" style="color:#C9654D">Instagram @${h(OBCHOD.instagram)}</a>
          ${OBCHOD.web ? `<br><a href="${h(OBCHOD.web)}" style="color:#C9654D">${h(OBCHOD.web)}</a>` : ""}
        </p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

// ---------- KÓPIA PRE VÁS ----------
function poslatObchodu(d) {
  const typy = { rezervacia: "Nová rezervácia", podobna: "Podobná torta na želanie", vlastna: "Torta na želanie – zavolať" };
  MailApp.sendEmail({
    to: OBCHOD.email,
    subject: `${typy[d.typ] || "Nová správa z webu"}: ${d.tortaNazov || ""} – ${d.meno || ""}`,
    body: d.zhrnutie || JSON.stringify(d, null, 2),
    replyTo: d.email || OBCHOD.email
  });
}

// ---------- TEST: pošle ukážkový e-mail na váš účet ----------
function testEmail() {
  poslatZakaznikovi({
    typ: "rezervacia", email: OBCHOD.email, meno: "Ukážka Zákazníčka",
    tortaNazov: "Modrý obláčik", cenaText: "52,90 €", cenaRozpis: "49,90 € + meno 3 €",
    menoNaTorte: "Tomáško", menoPriplatok: "3 €",
    obsah: ["Plienky: 56 ks · Baby Love · na 3–5 kg", "Detský šampón Baby Love", "Sprchový gél Baby Love", "Vlhčené utierky Baby Love", "Látková plienka"],
    terminText: "piatok 27. 11. 2026", cas: "16:30 – 20:00", miesto: "Dunajská Streda", platba: "Pri vyzdvihnutí.",
    poznamka: ""
  });
}
