// Monitor one or more Apify runs until each plateaus (5 stable polls) or ends.
// Usage: node --env-file=.env.local scripts/monitor-runs.mjs NAME runId datasetId [NAME runId datasetId ...]
const t = process.env.APIFY_TOKEN;
const runs = [];
for (let i = 2; i < process.argv.length; i += 3) runs.push([process.argv[i], process.argv[i + 1], process.argv[i + 2]]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prev = {}, stable = {};
for (let i = 0; i < 80; i++) {
  await sleep(20000);
  let allDone = true;
  let line = new Date().toISOString().slice(11, 19);
  for (const [nm, rid, did] of runs) {
    const j = await (await fetch(`https://api.apify.com/v2/datasets/${did}?token=${t}`)).json();
    const j2 = await (await fetch(`https://api.apify.com/v2/actor-runs/${rid}?token=${t}`)).json();
    const n = j.data.itemCount, s = j2.data.status;
    line += `  ${nm}:${n}/${s}`;
    if (n === prev[nm]) stable[nm] = (stable[nm] || 0) + 1; else stable[nm] = 0;
    prev[nm] = n;
    const ended = s !== "RUNNING" && s !== "READY" && s !== "PENDING";
    if (!(stable[nm] >= 5 || ended)) allDone = false;
  }
  console.log(line);
  if (allDone) { console.log("ALLDONE"); break; }
}
