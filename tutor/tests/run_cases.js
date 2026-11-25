/* node tutor/tests/run_cases.js cases.json results.json : sends each case to the live coach, one at a time. */
const fs = require('fs');
const [, , inFile, outFile] = process.argv;
const cases = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const URL = 'https://mr-r-coach.ncrncr23.workers.dev/coach';
(async () => {
  const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (out[c.id] && out[c.id].reply && !out[c.id].error) continue;
    const body = { device: 'dtestset' + Math.floor(i / 20), pack: c.pack, messages: c.messages, question: c.question };
    try {
      const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://mrrscience.co.za' }, body: JSON.stringify(body) });
      const j = await r.json();
      out[c.id] = { reply: j.reply || '', error: j.error || j.capped || j.off || null };
    } catch (e) { out[c.id] = { reply: '', error: String(e) }; }
    fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
    console.log(i + 1, c.id, (out[c.id].reply || out[c.id].error || '').slice(0, 80));
  }
})();
