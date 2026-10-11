/**
 * Runtime transactional email HTML — the gorgeous, on-brand dark templates the
 * worker sends via Resend (merch order receipt, cart recovery, admin sale ping).
 *
 * Mirrors the locked design system used by the Listmonk lifecycle templates in
 * `worker/listmonk-templates/*.html`: #050509 void, 600px rounded card, nebula
 * top-strip, Sora/Space-Grotesk/JetBrains-Mono, bulletproof (mso-VML) CTA.
 * Keep this in visual sync with those files when the system changes.
 */

const HEAD = (title: string, preheader: string) => `<!doctype html>
<html lang="en" style="margin:0;padding:0"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/><meta name="supported-color-schemes" content="dark"/>
<title>${title}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%}a{text-decoration:none}
img{border:0;line-height:100%;outline:none;-ms-interpolation-mode:bicubic}
@media only screen and (max-width:620px){.card{width:100%!important;border-radius:0!important;border-left:0!important;border-right:0!important}.pad{padding-left:24px!important;padding-right:24px!important}.h1{font-size:34px!important}.hero{padding-top:30px!important}}
</style></head>
<body style="margin:0;padding:0;background-color:#050509;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>`;

const FOOTER = (why: string) => `
<tr><td class="pad" style="padding:30px 40px 0"><div style="height:1px;background-image:linear-gradient(90deg,rgba(0,229,255,0.5),rgba(124,92,246,0.3),rgba(255,255,255,0))">&nbsp;</div></td></tr>
<tr><td class="pad" style="padding:22px 40px 34px">
<div style="font-family:'Sora',system-ui,sans-serif;font-size:15px;font-weight:800;color:#ffffff">bZ</div>
<div style="margin:3px 0 14px;font-size:13px;line-height:1.5;color:rgba(236,238,255,0.5)">Hard but holy. Hustle gospel out of Newark, NJ.</div>
<div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.04em;color:rgba(236,238,255,0.6)">
<a href="https://bz.rocks" style="color:#00e5ff;text-decoration:none">listen</a> &nbsp;·&nbsp; <a href="https://bz.rocks/stats" style="color:#00e5ff;text-decoration:none">stats</a> &nbsp;·&nbsp; <a href="https://bz.rocks/merch" style="color:#00e5ff;text-decoration:none">merch</a></div>
<div style="margin-top:16px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;line-height:1.6;letter-spacing:0.02em;color:rgba(236,238,255,0.4)">${why}<br/><a href="mailto:hey@megabyte.space" style="color:rgba(236,238,255,0.6);text-decoration:underline">hey@megabyte.space</a></div>
</td></tr></table>
<table role="presentation" class="card" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px"><tr><td align="center" style="padding:18px 0 0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(236,238,255,0.26)">bz.rocks</td></tr></table>
</td></tr></table></body></html>`;

/** Full card shell. `content` is the HTML between the hero and the footer divider. */
function shell(o: {
  title: string;
  preheader: string;
  borderRgba: string;
  strip: string;
  tag: string;
  eyebrow: string;
  eyebrowColor: string;
  rule: string;
  h1: string;
  content: string;
  why: string;
}): string {
  return `${HEAD(o.title, o.preheader)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#050509;background-image:radial-gradient(1100px 520px at 50% -8%,#10112a 0%,#090913 45%,#050509 100%)">
<tr><td align="center" style="padding:40px 12px">
<table role="presentation" class="card" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#0a0a16;border:1px solid ${o.borderRgba};border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(6,6,20,0.6)">
<tr><td height="5" style="height:5px;font-size:0;line-height:0;background-color:#00e5ff;background-image:${o.strip}">&nbsp;</td></tr>
<tr><td class="pad" style="padding:26px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="left" valign="middle"><a href="https://bz.rocks" style="text-decoration:none;color:#ffffff"><img src="https://bz.rocks/art/bz-app-icon-192.png?v=4" alt="bZ" width="40" height="40" style="display:inline-block;vertical-align:middle;border-radius:10px;border:1px solid rgba(0,229,255,0.35)"/><span style="display:inline-block;vertical-align:middle;margin-left:12px;font-family:'Sora',system-ui,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.01em;color:#ffffff">bZ</span></a></td>
<td align="right" valign="middle" style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:rgba(236,238,255,0.45)">${o.tag}</td></tr></table></td></tr>
<tr><td class="pad hero" style="padding:34px 40px 0"><div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:${o.eyebrowColor}">${o.eyebrow}</div><div style="width:54px;height:3px;margin:14px 0 0;border-radius:3px;background-image:${o.rule}">&nbsp;</div><h1 class="h1" style="margin:16px 0 0;font-family:'Sora',system-ui,sans-serif;font-size:42px;font-weight:900;color:#ffffff;line-height:1.02;letter-spacing:-0.03em">${o.h1}</h1></td></tr>
${o.content}
${FOOTER(o.why)}`;
}

const CTA_CYAN = (href: string, label: string, widthPx: number) =>
  `<tr><td class="pad" align="left" style="padding:24px 40px 0">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:50px;v-text-anchor:middle;width:${widthPx}px" arcsize="100%" fillcolor="#00E5FF" stroke="f"><center style="color:#04060f;font-family:sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><a href="${href}" style="display:inline-block;font-family:'Sora',system-ui,sans-serif;font-weight:700;font-size:16px;color:#04060f;background-color:#00e5ff;background-image:linear-gradient(135deg,#00e5ff 0%,#4fd1ff 52%,#50aae3 100%);padding:15px 30px;border-radius:999px;box-shadow:0 10px 30px rgba(0,229,255,0.32)">${label}</a><!--<![endif]--></td></tr>`;

const chip = (border: string, bg: string, html: string) =>
  `<tr><td class="pad" style="padding:26px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${bg};border:1px solid ${border};border-radius:14px"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.55;color:rgba(236,238,255,0.78)">${html}</td></tr></table></td></tr>`;

export interface OrderItem {
  desc: string;
  qty: number;
  total: number;
}

/** Customer merch order receipt. */
export function orderReceivedEmail(d: {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  orderId: string | number;
  sessionTail: string;
}): string {
  const rows = d.items
    .map(
      i =>
        `<tr><td style="padding:6px 0;color:#ffffff">${i.qty} &times; ${i.desc}</td><td align="right" style="padding:6px 0;color:#ffffff;white-space:nowrap">$${i.total.toFixed(2)}</td></tr>`
    )
    .join('');
  const content = `
<tr><td class="pad" style="padding:22px 40px 0;font-size:16px;line-height:1.62;color:rgba(236,238,255,0.88)"><p style="margin:0">Printful is making this for you right now. Tracking arrives in 2&ndash;3 business days, the moment it ships.</p></td></tr>
<tr><td class="pad" style="padding:24px 40px 0">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.2);border-radius:14px">
<tr><td style="padding:18px 20px 6px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(236,238,255,0.5)">your order</td></tr>
<tr><td style="padding:0 20px;font-size:15px;line-height:1.5;color:rgba(236,238,255,0.9)"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table></td></tr>
<tr><td style="padding:10px 20px 0"><div style="height:1px;background-image:linear-gradient(90deg,rgba(0,229,255,0.4),rgba(255,255,255,0))">&nbsp;</div></td></tr>
<tr><td style="padding:8px 20px 18px;font-size:15px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="color:rgba(236,238,255,0.6)">Shipping</td><td align="right" style="color:rgba(236,238,255,0.8)">$${d.shipping.toFixed(2)}</td></tr>
<tr><td style="padding-top:6px;font-family:'Sora',sans-serif;font-weight:800;color:#ffffff">Total</td><td align="right" style="padding-top:6px;font-family:'Sora',sans-serif;font-weight:800;color:#34f5c5">$${d.total.toFixed(2)}</td></tr>
</table></td></tr></table>
<div style="margin-top:10px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:rgba(236,238,255,0.4)">Order #${d.orderId} &nbsp;·&nbsp; ref sess&#8230;${d.sessionTail}</div></td></tr>
${CTA_CYAN('https://bz.rocks', '&#9654;&nbsp; Listen while you wait', 230)}
${chip('rgba(124,92,246,0.26)', 'rgba(124,92,246,0.1)', 'Something off with the order? Just reply — <em style="color:#c4b5fd;font-style:normal">hey@megabyte.space</em> reaches me, not a queue.')}`;
  return shell({
    title: 'order received',
    preheader: 'Order received — Printful is making it now. Tracking lands in 2&ndash;3 business days.',
    borderRgba: 'rgba(52,245,197,0.26)',
    strip: 'linear-gradient(90deg,#00e5ff 0%,#34f5c5 60%,#7c3aed 100%)',
    tag: 'merch&nbsp;·&nbsp;receipt',
    eyebrow: 'order received',
    eyebrowColor: '#34f5c5',
    rule: 'linear-gradient(90deg,#00e5ff,#34f5c5)',
    h1: "it's in motion.",
    content,
    why: "You're getting this because you placed an order at bz.rocks/merch."
  });
}

/** Customer cart-recovery (checkout expired or async payment failed). */
export function cartRecoveryEmail(d: { expired: boolean }): string {
  const h1 = d.expired ? 'you left something behind.' : "your payment didn't go through.";
  const body = d.expired
    ? `<p style="margin:0 0 14px">Your checkout didn't finish — and <strong style="color:#ffffff">no charge was made.</strong> Everything's still sitting in your cart.</p><p style="margin:0">Pick up right where you left off whenever you're ready. The suite's still open.</p>`
    : `<p style="margin:0 0 14px">Your payment didn't complete — and <strong style="color:#ffffff">no charge was made.</strong> It happens; the card just didn't clear.</p><p style="margin:0">Everything's still in your cart. Try again whenever you're ready.</p>`;
  const content = `
<tr><td class="pad" style="padding:22px 40px 0;font-size:16px;line-height:1.62;color:rgba(236,238,255,0.88)">${body}</td></tr>
${CTA_CYAN('https://bz.rocks/merch', 'Return to the merch suite &#8594;', 280)}
${chip('rgba(255,210,63,0.26)', 'rgba(255,210,63,0.09)', "Changed your mind? No worries — just ignore this and it'll clear itself out. Nothing was charged.")}`;
  return shell({
    title: d.expired ? 'your cart is still warm' : "your payment didn't complete",
    preheader: "Your cart's still warm — no charge was made. Pick up right where you left off.",
    borderRgba: 'rgba(255,210,63,0.26)',
    strip: 'linear-gradient(90deg,#00e5ff 0%,#ffd23f 70%,#ff7a3f 100%)',
    tag: 'merch&nbsp;·&nbsp;cart',
    eyebrow: d.expired ? 'cart still warm' : 'payment incomplete',
    eyebrowColor: '#ffd23f',
    rule: 'linear-gradient(90deg,#00e5ff,#ffd23f)',
    h1,
    content,
    why: 'You started a checkout at bz.rocks/merch.'
  });
}

/** Internal admin "new sale" notification. */
export function adminSaleEmail(d: {
  itemCount: number;
  email: string;
  orderId: string | number;
  sessionTail: string;
  total: number;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#050509;font-family:'JetBrains Mono',ui-monospace,monospace">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050509"><tr><td align="center" style="padding:40px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0a0a16;border:1px solid rgba(52,245,197,.28);border-radius:16px">
<tr><td height="4" style="height:4px;font-size:0;background-image:linear-gradient(90deg,#00e5ff,#34f5c5,#7c3aed)">&nbsp;</td></tr>
<tr><td style="padding:22px 24px"><div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#34f5c5">new sale</div>
<div style="margin-top:12px;font-size:14px;line-height:1.8;color:#eceeff">${d.itemCount} item(s) &nbsp;·&nbsp; ${d.email}<br/>Printful #${d.orderId}<br/>Stripe sess …${d.sessionTail}<br/>Total <span style="color:#34f5c5">$${d.total.toFixed(2)}</span></div></td></tr></table></td></tr></table></body></html>`;
}
