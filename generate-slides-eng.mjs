import { readFileSync, writeFileSync } from 'fs';

const canvas = readFileSync(
  'C:/Users/User/.cursor/projects/c-Users-User-Documents-GitHub-Carrentdesk/canvases/ideju-kauss-presentation-eng.canvas.tsx',
  'utf8'
);

// Extract base64 images
const logoEBMatch = canvas.match(/const LOGO_EB = "([^"]+)"/);
const logoDCMatch = canvas.match(/const LOGO_DC = "([^"]+)"/);
const screenshotMatch = canvas.match(/src="(data:image\/jpeg;base64,[^"]+)"\s*\n\s*alt="balticcarrent/);

const LOGO_EB = logoEBMatch ? logoEBMatch[1] : '';
const LOGO_DC = logoDCMatch ? logoDCMatch[1] : '';
const BCR_SCREENSHOT = screenshotMatch ? screenshotMatch[1] : '';

console.log('LOGO_EB length:', LOGO_EB.length);
console.log('LOGO_DC length:', LOGO_DC.length);
console.log('BCR_SCREENSHOT length:', BCR_SCREENSHOT.length);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>CarRentDesk — Ideju Kauss 2026 (ENG)</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #1a1a2e; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; font-family: system-ui, -apple-system, sans-serif; }
.nav-bar { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; justify-content: center; max-width: 1280px; }
.nav-btn { padding: 5px 12px; border-radius: 4px; border: none; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); font-size: 14px; cursor: pointer; }
.nav-btn.active { background: #f59e0b; color: #081a3a; font-weight: 700; }
.slide-wrap { width: 1280px; height: 720px; border-radius: 10px; overflow: hidden; position: relative; }
.slide { width: 1280px; height: 720px; overflow: hidden; display: none; position: absolute; top: 0; left: 0; }
.slide.active { display: block; }
.dots { display: flex; gap: 8px; margin-top: 16px; justify-content: center; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; border: none; }
.dot.active { background: #f59e0b; }
.nav-arrows { display: flex; gap: 12px; margin-top: 12px; }
.nav-arrows button { padding: 8px 20px; border-radius: 6px; border: none; background: rgba(255,255,255,0.1); color: #fff; font-size: 15px; cursor: pointer; }
</style>
</head>
<body>

<div class="nav-bar" id="navBar"></div>
<div class="slide-wrap" id="slideWrap">

<!-- SLIDE 0: Title -->
<div class="slide active" id="slide-0">
<div style="background:#081a3a;width:1280px;height:720px;overflow:hidden;padding:64px 100px 52px;display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <div style="width:40px;height:3px;background:#f59e0b;border-radius:2px;margin-bottom:28px;"></div>
    <div style="color:rgba(255,255,255,0.35);font-size:22px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">Startup Competition 2026</div>
    <div style="color:#ffffff;font-size:64px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;margin-bottom:18px;">CarRentDesk</div>
    <div style="color:#f59e0b;font-size:30px;font-weight:600;line-height:1.45;max-width:700px;">Helping car rentals get more clients and increase profit</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="color:rgba(255,255,255,0.35);font-size:18px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Founder</div>
      <div style="color:#ffffff;font-size:24px;font-weight:700;">Guntars Nemiro</div>
      <div style="color:rgba(255,255,255,0.5);font-size:18px;margin-top:4px;">Baltic Car Rent — Riga</div>
    </div>
    <div style="color:#f59e0b;font-size:26px;font-weight:700;letter-spacing:0.03em;">CarRentDesk.com</div>
  </div>
</div>
</div>

<!-- SLIDE 1: Intro -->
<div class="slide" id="slide-1">
<div style="background:#0f2a52;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <div style="color:rgba(255,255,255,0.45);font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">Intro — Baltic Car Rent</div>
    <div style="color:#ffffff;font-size:38px;font-weight:700;margin-bottom:6px;">I run a car rental in Riga.</div>
    <div style="color:rgba(255,255,255,0.55);font-size:22px;margin-bottom:20px;">Started with 0 cars. 16 cars in 4 years. Online — from day one.</div>
  </div>
  <div style="display:flex;gap:32px;align-items:flex-start;">
    <div style="flex:1;">
      <div style="color:rgba(255,255,255,0.4);font-size:16px;margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">balticcarrent.lv — before</div>
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:20px 24px;font-size:19px;color:rgba(255,255,255,0.6);line-height:1.7;">
        Bookings only by phone<br>
        Only Latvian customers<br>
        Average rate: <strong style="color:#ffffff;">€18/day</strong><br>
        All this — <strong style="color:#ffffff;">without a website.</strong>
      </div>
    </div>
    <div style="flex:1.4;">
      <div style="color:rgba(255,255,255,0.4);font-size:16px;margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">balticcarrent.lv — live</div>
      ${BCR_SCREENSHOT ? `<img src="${BCR_SCREENSHOT}" alt="balticcarrent.lv" style="width:100%;height:260px;object-fit:cover;object-position:top;border-radius:8px;display:block;" />` : '<div style="width:100%;height:260px;background:rgba(255,255,255,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:18px;">balticcarrent.lv</div>'}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px;">
    ${[
      {v:'€38/day', l:'Average daily rate'},
      {v:'40', l:'Customer countries'},
      {v:'300', l:'Online bookings / 4mo'},
      {v:'€65K', l:'Online revenue'},
    ].map(s => `<div style="padding:16px 18px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
      <div style="color:#f59e0b;font-size:28px;font-weight:700;margin-bottom:4px;">${s.v}</div>
      <div style="color:rgba(255,255,255,0.5);font-size:15px;">${s.l}</div>
    </div>`).join('')}
  </div>
</div>
</div>

<!-- SLIDE 2: Proof -->
<div class="slide" id="slide-2">
<div style="background:#f8fafc;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="color:#234389;font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Proof — balticcarrent.lv</div>
  <div style="color:#0f2a52;font-size:38px;font-weight:700;margin-bottom:32px;">What going online means</div>
  <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="display:grid;grid-template-columns:1fr 160px 260px;background:#0f2a52;padding:14px 26px;">
      <div style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Metric</div>
      <div style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Before</div>
      <div style="color:#f59e0b;font-size:18px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">After (4 months)</div>
    </div>
    ${[
      {l:'Online bookings', b:'0', a:'300 / 4 months'},
      {l:'Customer origin countries', b:'Latvia', a:'40 countries'},
      {l:'Online revenue', b:'—', a:'€65,000'},
      {l:'Average daily rate', b:'€18', a:'€38'},
    ].map((r,i) => `<div style="display:grid;grid-template-columns:1fr 160px 260px;padding:22px 26px;border-top:1px solid #f1f5f9;background:${i%2===0?'#ffffff':'#f8fafc'};align-items:center;">
      <div style="color:#475569;font-size:18px;">${r.l}</div>
      <div style="color:#94a3b8;font-size:18px;">${r.b}</div>
      <div style="color:#234389;font-size:26px;font-weight:700;">${r.a}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:24px;padding:22px 26px;background:#0f2a52;border-radius:8px;color:#ffffff;font-size:20px;line-height:1.6;">
    Price doubled. Costs unchanged. <strong style="color:#f59e0b;">Profit 🚀</strong>
  </div>
</div>
</div>

<!-- SLIDE 3: Discovery -->
<div class="slide" id="slide-3">
<div style="background:#1d3771;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <div style="color:rgba(255,255,255,0.5);font-size:24px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:24px;">The Painful Discovery</div>
    <div style="color:#f59e0b;font-size:50px;font-weight:700;line-height:1.25;margin-bottom:12px;">❌ I cancelled 190 bookings.</div>
    <div style="color:#ffffff;font-size:50px;font-weight:700;line-height:1.25;margin-bottom:12px;">🚗 Bought 16 cars in summer.</div>
    <div style="color:#ffffff;font-size:50px;font-weight:700;line-height:1.25;margin-bottom:28px;">😤 Still needed 20 more.</div>
    <div style="color:rgba(255,255,255,0.65);font-size:22px;line-height:1.7;max-width:680px;">
      💡 Painful to cancel every booking. But it led to <strong style="color:#ffffff;">2 ideas:</strong>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:rgba(255,255,255,0.07);border-radius:8px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
      <div style="color:#f59e0b;font-size:21px;font-weight:700;margin-bottom:12px;">Idea 1</div>
      <div style="color:rgba(255,255,255,0.85);font-size:20px;line-height:1.6;">Bookings I cannot handle myself should be passed to competing rentals.</div>
    </div>
    <div style="background:rgba(255,255,255,0.07);border-radius:8px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
      <div style="color:#f59e0b;font-size:21px;font-weight:700;margin-bottom:12px;">Idea 2</div>
      <div style="color:rgba(255,255,255,0.85);font-size:20px;line-height:1.6;">If I achieved these results in Riga in 6 months, I can replicate this anywhere!</div>
    </div>
  </div>
</div>
</div>

<!-- SLIDE 4: Solution -->
<div class="slide" id="slide-4">
<div style="background:#ffffff;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="color:#234389;font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Solution</div>
  <div style="color:#0f2a52;font-size:38px;font-weight:700;margin-bottom:8px;">CarRentDesk helps local car rentals</div>
  <div style="color:#0f2a52;font-size:38px;font-weight:700;margin-bottom:8px;"><span style="color:#f59e0b;">compete</span> with Sixt and Hertz</div>
  <div style="margin-top:32px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${[
      {n:'1', l:'Customer picks destination', s:'Riga, Podgorica, Athens…'},
      {n:'2', l:'Sees local rental offers', s:'Real cars, prices, dates'},
      {n:'3', l:'Books directly', s:'No big middlemen'},
    ].map(s => `<div style="padding:28px 26px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
      <div style="color:#f59e0b;font-size:44px;font-weight:700;margin-bottom:14px;">${s.n}</div>
      <div style="color:#0f2a52;font-size:22px;font-weight:600;margin-bottom:8px;">${s.l}</div>
      <div style="color:#475569;font-size:17px;">${s.s}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="padding:22px 26px;background:#0f2a52;border-radius:8px;">
      <div style="color:rgba(255,255,255,0.5);font-size:24px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Business model</div>
      <div style="color:#f59e0b;font-size:34px;font-weight:700;">10% commission</div>
      <div style="color:rgba(255,255,255,0.6);font-size:19px;margin-top:4px;">per completed booking</div>
    </div>
    <div style="padding:22px 26px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
      <div style="color:#475569;font-size:24px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Additional</div>
      <div style="color:#0f2a52;font-size:24px;font-weight:600;">Fleet management platform</div>
      <div style="color:#475569;font-size:19px;margin-top:4px;">Saves me 10h/week</div>
    </div>
  </div>
</div>
</div>

<!-- SLIDE 5: Traction -->
<div class="slide" id="slide-5">
<div style="background:#081a3a;width:1280px;height:720px;overflow:hidden;padding:44px 80px 36px;display:flex;flex-direction:column;gap:12px;">
  <div style="color:rgba(255,255,255,0.5);font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Right now</div>
  <div style="color:#ffffff;font-size:38px;font-weight:700;margin-bottom:24px;">CarRentDesk is live. Demand exists.</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
    ${[
      {v:'6,500', l:'Rentals in catalog'},
      {v:'29', l:'Countries'},
      {v:'150', l:'Cities'},
      {v:'6,000', l:'Visitors/month'},
      {v:'~200', l:'Inquiries/month'},
      {v:'€0', l:'Marketing budget'},
    ].map(s => `<div style="padding:22px 24px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
      <div style="color:#f59e0b;font-size:38px;font-weight:700;margin-bottom:6px;">${s.v}</div>
      <div style="color:rgba(255,255,255,0.5);font-size:16px;">${s.l}</div>
    </div>`).join('')}
  </div>
  <div style="padding:22px 26px;background:rgba(245,158,11,0.1);border-radius:8px;border:1px solid rgba(245,158,11,0.25);margin-bottom:12px;">
    <div style="color:rgba(255,255,255,0.45);font-size:24px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Current demand on platform</div>
    <div style="display:flex;align-items:baseline;gap:12px;">
      <span style="color:#f59e0b;font-size:30px;font-weight:700;">€1.8M / mo.</span>
      <span style="color:rgba(255,255,255,0.4);font-size:16px;">6,000 visitors × €300 avg. rental</span>
    </div>
  </div>
  <div style="padding:22px 26px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
    <div style="color:rgba(255,255,255,0.45);font-size:24px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">If we convert just 5% at 10% commission</div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center;">
      <div style="text-align:center;"><div style="color:rgba(255,255,255,0.5);font-size:19px;margin-bottom:4px;">Demand</div><div style="color:#ffffff;font-size:24px;font-weight:600;">€1.8M</div></div>
      <div style="color:rgba(255,255,255,0.25);font-size:18px;">×</div>
      <div style="text-align:center;"><div style="color:rgba(255,255,255,0.5);font-size:19px;margin-bottom:4px;">Conversion</div><div style="color:#ffffff;font-size:24px;font-weight:600;">5%</div></div>
      <div style="color:rgba(255,255,255,0.25);font-size:18px;">×</div>
      <div style="text-align:center;"><div style="color:rgba(255,255,255,0.5);font-size:19px;margin-bottom:4px;">Commission</div><div style="color:#ffffff;font-size:24px;font-weight:600;">10%</div></div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
      <div><span style="color:rgba(255,255,255,0.45);font-size:17px;">Monthly: </span><span style="color:#f59e0b;font-size:28px;font-weight:700;">€9 000</span></div>
      <div style="width:1px;height:24px;background:rgba(255,255,255,0.1);"></div>
      <div><span style="color:rgba(255,255,255,0.45);font-size:17px;">Yearly: </span><span style="color:#f59e0b;font-size:34px;font-weight:700;">€108 000</span></div>
    </div>
  </div>
</div>
</div>

<!-- SLIDE 6: Market -->
<div class="slide" id="slide-6">
<div style="background:#f8fafc;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="color:#234389;font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Market</div>
  <div style="color:#0f2a52;font-size:38px;font-weight:700;margin-bottom:8px;">2 proven players already exist</div>
  <div style="color:#475569;font-size:20px;margin-bottom:28px;">Both focus on major chains — <strong style="color:#0f2a52;">local rentals stay invisible.</strong></div>
  <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="display:grid;grid-template-columns:2fr 130px 130px 1.4fr;background:#0f2a52;padding:14px 24px;gap:8px;">
      ${['Company','Revenue','Profit','Clients'].map(h => `<div style="color:rgba(255,255,255,0.45);font-size:24px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">${h}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:2fr 130px 130px 1.4fr;padding:22px 26px;border-top:1px solid #f1f5f9;background:#ffffff;gap:8px;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:72px;height:28px;background:#ffffff;border-radius:4px;border:1px solid #e0e0e0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 4px;flex-shrink:0;">
          ${LOGO_DC ? `<img src="${LOGO_DC}" alt="Discover Cars" style="width:100%;height:100%;object-fit:contain;" />` : '<span style="color:#1a73e8;font-size:7px;font-weight:800;">DISCOVER CARS</span>'}
        </div>
        <div style="color:#334155;font-size:24px;font-weight:600;">Discover Cars</div>
      </div>
      <div style="color:#475569;font-size:18px;font-weight:500;">€71M</div>
      <div style="color:#16a34a;font-size:24px;font-weight:600;">€19M</div>
      <div style="color:#475569;font-size:16px;line-height:1.4;">Sixt, Hertz, Europcar</div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 130px 130px 1.4fr;padding:22px 26px;border-top:1px solid #f1f5f9;background:#f8fafc;gap:8px;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:72px;height:28px;background:#1c3f9c;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 4px;flex-shrink:0;">
          ${LOGO_EB ? `<img src="${LOGO_EB}" alt="Economy Bookings" style="width:100%;height:100%;object-fit:contain;" />` : '<span style="color:#fff;font-size:7px;font-weight:800;">Economy Bookings</span>'}
        </div>
        <div style="color:#334155;font-size:24px;font-weight:600;">Economy Bookings</div>
      </div>
      <div style="color:#475569;font-size:18px;font-weight:500;">€204M</div>
      <div style="color:#16a34a;font-size:24px;font-weight:600;">€9.5M</div>
      <div style="color:#475569;font-size:16px;line-height:1.4;">Sixt, Hertz, Europcar</div>
    </div>
  </div>
  <div style="margin-top:16px;padding:20px 24px;background:#0f2a52;border-radius:8px;display:flex;align-items:center;gap:12px;">
    <div style="color:#f59e0b;font-size:26px;font-weight:700;flex-shrink:0;">CarRentDesk</div>
    <div style="width:1px;height:28px;background:rgba(255,255,255,0.15);"></div>
    <div style="color:rgba(255,255,255,0.75);font-size:19px;">
      First to focus on <strong style="color:#ffffff;">~50,000 local rentals in Europe</strong> — the market big players ignore.
    </div>
  </div>
</div>
</div>

<!-- SLIDE 7: Differentiation -->
<div class="slide" id="slide-7">
<div style="background:#ffffff;width:1280px;height:720px;overflow:hidden;padding:52px 80px 44px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="color:#0f2a52;font-size:32px;font-weight:700;margin-bottom:24px;">What we do that big players <span style="color:#f59e0b;">cannot</span> or <span style="color:#f59e0b;">won't</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:#0f2a52;border-radius:10px;padding:20px 22px;">
      <div style="color:#f59e0b;font-size:17px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;">🏢 For Rentals</div>
      ${[
        {i:'✅', t:'Easy onboarding — no strict requirements, no long contracts'},
        {i:'💰', t:'More profit — rental handles insurance, not the middleman'},
        {i:'📉', t:'10% commission vs Discover Cars / Economy Bookings 25–30%'},
        {i:'🛠️', t:'Built-in fleet management — bookings, cars, clients in one place'},
      ].map(item => `<div style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
        <span style="font-size:19px;flex-shrink:0;margin-top:1px;">${item.i}</span>
        <div style="color:rgba(255,255,255,0.82);font-size:18px;line-height:1.55;">${item.t}</div>
      </div>`).join('')}
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:20px 22px;border:1px solid #e2e8f0;">
      <div style="color:#234389;font-size:17px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;">🧳 For Customers</div>
      ${[
        {i:'🚫💳', t:'Rental without credit card or deposit — niches that big players ignore'},
        {i:'🚗', t:'Car delivery & pickup — locations beyond the airport'},
        {i:'🤝', t:'Flexible terms — young drivers, special requirements'},
      ].map(item => `<div style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
        <span style="font-size:19px;flex-shrink:0;margin-top:1px;">${item.i}</span>
        <div style="color:#334155;font-size:18px;line-height:1.55;">${item.t}</div>
      </div>`).join('')}
    </div>
  </div>
  <div style="margin-top:16px;padding:13px 18px;background:#0f2a52;border-radius:8px;color:rgba(255,255,255,0.75);font-size:18px;line-height:1.6;">
    Discover Cars and Economy Bookings serve the big chains — <strong style="color:#ffffff;">Sixt and Hertz.</strong><br>
    CarRentDesk focuses on <strong style="color:#f59e0b;">independent local car rentals.</strong>
  </div>
</div>
</div>

<!-- SLIDE 8: Next Steps (Slide9 in canvas) -->
<div class="slide" id="slide-8">
<div style="background:#081a3a;width:1280px;height:720px;overflow:hidden;padding:48px 80px 36px;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="color:rgba(255,255,255,0.45);font-size:19px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Next Steps</div>
  <div style="color:#ffffff;font-size:32px;font-weight:700;margin-bottom:6px;">From a listings board to a real <span style="color:#f59e0b;">booking platform</span></div>
  <div style="color:rgba(255,255,255,0.5);font-size:19px;margin-bottom:24px;">Demand is proven. Next step — convert it into real bookings.</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    ${[
      {i:'🚗', t:'Real vehicles', d:'Rentals list their fleet — specific models with availability'},
      {i:'📸', t:'Photos', d:'Every car with photos — customer knows exactly what they get'},
      {i:'💶', t:'Pricing', d:'Real daily rates with seasonality and conditions'},
      {i:'⚙️', t:'Add-ons', d:'GPS, child seats, insurance packages, delivery'},
      {i:'📅', t:'Booking', d:'Online booking with date selection and availability check'},
      {i:'💳', t:'Payment', d:'Secure online payment — no calls, no emails'},
    ].map(s => `<div style="padding:22px 24px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);">
      <div style="font-size:30px;margin-bottom:10px;">${s.i}</div>
      <div style="color:#ffffff;font-size:24px;font-weight:600;margin-bottom:6px;">${s.t}</div>
      <div style="color:rgba(255,255,255,0.5);font-size:16px;line-height:1.55;">${s.d}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:16px;padding:18px 22px;background:rgba(245,158,11,0.12);border-radius:8px;border:1px solid rgba(245,158,11,0.25);display:flex;align-items:center;gap:12px;">
    <span style="font-size:20px;">🎯</span>
    <div style="color:rgba(255,255,255,0.8);font-size:18px;">
      Goal: <strong style="color:#f59e0b;">Riga 2026</strong> — 28 Baltic Car Rent vehicles as the first full booking experience on the platform
    </div>
  </div>
</div>
</div>

<!-- SLIDE 9: Closing (Slide8 in canvas) -->
<div class="slide" id="slide-9">
<div style="background:#0f2a52;width:1280px;height:720px;overflow:hidden;padding:64px 100px 52px;display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <div style="width:40px;height:3px;background:#f59e0b;border-radius:2px;margin-bottom:24px;"></div>
    <div style="color:rgba(255,255,255,0.45);font-size:24px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">Closing</div>
    <div style="color:#ffffff;font-size:36px;font-weight:700;margin-bottom:28px;">Helping car rentals grow.</div>
    <div style="color:rgba(255,255,255,0.55);font-size:22px;line-height:1.7;max-width:680px;margin-bottom:28px;">There are thousands of car rentals invisible online.</div>
    <div style="color:#ffffff;font-size:28px;font-weight:600;line-height:1.65;max-width:680px;margin-bottom:28px;">
      I proved that in <span style="color:#f59e0b;">6 months</span>, a website alone can generate <span style="color:#f59e0b;">€65K in new revenue.</span>
    </div>
    <div style="color:#ffffff;font-size:28px;font-weight:600;line-height:1.65;max-width:680px;margin-bottom:28px;">
      Local rentals can <span style="color:#f59e0b;">compete with Sixt and Hertz</span> — they just need <span style="color:#f59e0b;">the right tools.</span>
    </div>
    <div style="color:rgba(255,255,255,0.55);font-size:22px;line-height:1.7;max-width:680px;">
      I will use my experience and digital solutions to help local car rentals grow revenue and profit.
    </div>
  </div>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;">
    <div style="color:rgba(255,255,255,0.35);font-size:18px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Guntars Nemiro</div>
    <div style="color:#f59e0b;font-size:30px;font-weight:700;letter-spacing:0.03em;">CarRentDesk.com</div>
  </div>
</div>
</div>

</div><!-- end slide-wrap -->

<div class="dots" id="dots"></div>
<div class="nav-arrows">
  <button onclick="changeSlide(-1)">← Prev</button>
  <button onclick="changeSlide(1)">Next →</button>
</div>

<script>
const LABELS = ["Title","Intro","Proof","Discovery","Solution","Traction","Market","Differentiation","Next Steps","Closing"];
const total = 10;
let current = 0;

function renderNav() {
  const nb = document.getElementById('navBar');
  nb.innerHTML = LABELS.map((l,i) =>
    \`<button class="nav-btn\${i===current?' active':''}" onclick="goTo(\${i})">\${i+1}. \${l}</button>\`
  ).join('');
  const dots = document.getElementById('dots');
  dots.innerHTML = Array.from({length:total},(_,i) =>
    \`<button class="dot\${i===current?' active':''}" onclick="goTo(\${i})"></button>\`
  ).join('');
}

function goTo(n) {
  document.getElementById('slide-'+current).classList.remove('active');
  current = n;
  document.getElementById('slide-'+current).classList.add('active');
  renderNav();
}

function changeSlide(dir) {
  goTo((current + dir + total) % total);
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changeSlide(1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') changeSlide(-1);
});

renderNav();
</script>
</body>
</html>`;

writeFileSync('C:/Users/User/Documents/GitHub/Carrentdesk/presentation-slides-eng.html', html, 'utf8');
console.log('Done! HTML written.');
console.log('File size:', html.length, 'bytes');
