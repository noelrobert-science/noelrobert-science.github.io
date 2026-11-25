/* Mr R's study coach: the small server between mrrscience.co.za and the AI (Cloudflare Worker, one file, no build).
   Built 25 Nov 2026 for the private test only. It holds the AI key, adds the coach's rules and the question's material,
   enforces the limits, and keeps an anonymous log for Noel's review.

   Settings in Cloudflare (Workers > mrr-coach > Settings):
     Secret    ANTHROPIC_API_KEY  Noel pastes this himself. It never appears in this file or on the site.
     Variable  COACH_ON           "1" = on, anything else = off (the off switch, takes effect at once)
     Variable  MODEL              default claude-opus-5-5
     Variable  DEVICE_DAY_TURNS   default 30 turns per device per day
     Variable  ALL_DAY_TURNS      default 300 turns per day for everyone together
     KV        COACH_KV           counters and logs (logs deleted after 30 days)

   What is stored per turn: a random device code made in the learner's browser, the question code, the conversation
   and the reply. No name, no school, no IP address. Raw HTTP is used because a one-file Worker pasted into the
   Cloudflare dashboard cannot bundle the Anthropic SDK. */

const ORIGINS = ['https://mrrscience.co.za', 'https://www.mrrscience.co.za', 'https://noelrobert-science.github.io', 'http://localhost:8765', 'http://127.0.0.1:8765'];
const API = 'https://api.anthropic.com/v1/messages';
const SITE = 'https://mrrscience.co.za/tutor/';   /* rules.txt and packs/<studio>-<topic>.txt live in the site repo, so updates need no Cloudflare clicks */
const CACHE = {};
async function siteText(path) {
const hit = CACHE[path];
if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.v;
try { const r = await fetch(SITE + path, { cf: { cacheTtl: 600 } }); const v = r.ok ? (await r.text()).slice(0, 60000) : ''; CACHE[path] = { t: Date.now(), v: v }; return v; } catch (e) { return hit ? hit.v : ''; }
}

/* Fallback rules, used only if tutor/rules.txt on the site cannot be read. The approved rules live in tutor/rules.txt. */
const RULES = `You are Mr R's study coach for IEB Physical Sciences, inside a practice question in the Mr R Science app.
You are not Mr R and never claim to be. You help a high-school learner finish THIS question themselves, then send them back to paper.

How you help:
- The learner has already tried. Read their working and find the FIRST line that is wrong or missing. Ask ONE question about it.
- Climb one rung at a time, only after another try: a nudge, then the first line, then one like this with different numbers, then the coursebook idea, then a fresh question. Never give the full answer or the final number before the learner has made two more real attempts.
- Use the memo's marking language: formula, substitution, answer with unit. Say "The memo gives 3 marks. You have 2", never "Not quite".
- For vectors (momentum, force, velocity): the learner chooses the positive direction; the answer is a size, a unit and a direction; never a negative and a direction on the same line.
- Use only the material given below for this question and say where a fact comes from ("the worked answer", "the memo", "Mr R's marking"). If something is not in it, say "That isn't in Mr R's material, so check it with him."
- At most three short sentences and one question per reply. Plain English for a 15-year-old. South African spelling. Decimal comma.
- End every session with a paper task: "Close the screen. Do this one in pen."
- Off-topic or "just give me the answer": one friendly line, then back to the question. If the learner mentions being unsafe, upset or hurt, say kindly that a trusted adult or the school can help, and stop coaching.
- Never ask for a name, school or anything personal. Never predict a mark. Never mention points or streaks.`;

function cors(origin) {
  const ok = ORIGINS.includes(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin : ORIGINS[0], 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
function json(obj, status, origin) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin)) }); }
function day() { return new Date().toISOString().slice(0, 10); }
function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

async function bump(kv, key, limit) {
  const n = +(await kv.get(key)) || 0;
  if (n >= limit) return false;
  await kv.put(key, String(n + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (url.pathname === '/health') return json({ on: env.COACH_ON === '1' }, 200, origin);
    if (req.method !== 'POST' || url.pathname !== '/coach') return json({ error: 'not found' }, 404, origin);
    if (!ORIGINS.includes(origin)) return json({ error: 'not allowed' }, 403, origin);
    if (env.COACH_ON !== '1') return json({ off: true, reply: 'The coach is switched off just now. Use the hints on the page, or ask Mr R tomorrow.' }, 200, origin);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'bad request' }, 400, origin); }
    const device = clip(body.device, 40).replace(/[^a-z0-9-]/gi, '');
    if (!device) return json({ error: 'bad request' }, 400, origin);
    const d = day(), kv = env.COACH_KV;
    if (!(await bump(kv, 'all:' + d, +(env.ALL_DAY_TURNS || 300)))) return json({ capped: true, reply: 'The coach has had a busy day and is resting. Use the hints on the page, or try again tomorrow.' }, 200, origin);
    if (!(await bump(kv, 'dev:' + device + ':' + d, +(env.DEVICE_DAY_TURNS || 30)))) return json({ capped: true, reply: 'That is enough screen for today. Close the screen and do the next question in pen.' }, 200, origin);

    /* the question's material, sent by the page: stem, parts, worked answer, the learner's lines, the rung reached */
    const q = body.question || {};
    const material = 'THE QUESTION (code ' + clip(q.code, 60) + ')\n' + clip(q.stem, 1500) + '\n\nPARTS AND THE WORKED ANSWER (do not reveal before two more real attempts)\n' + clip(q.worked, 4000) +
      '\n\nWHAT THE LEARNER WROTE\n' + clip(q.learner, 2000) + '\n\nWHAT THE PAGE ALREADY TOLD THEM\n' + clip(q.feedback, 1500);
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.text, 1200) })).filter(m => m.content);
    if (!msgs.length || msgs[0].role !== 'user') msgs.unshift({ role: 'user', content: 'I tried this and I am stuck. Help me find my mistake.' });

    const rules = (await siteText('rules.txt')) || RULES;
    const packName = /^[a-z]+-[A-Za-z0-9]+$/.test(String(body.pack || '')) ? body.pack : '';
    const pack = packName ? await siteText('packs/' + packName + '.txt') : '';
    const sys = [{ type: 'text', text: rules }];
    if (pack) sys.push({ type: 'text', text: 'TOPIC PACK (' + packName + '): Mr R material for this topic. Use it and name its sources.\n\n' + pack, cache_control: { type: 'ephemeral' } });
    sys.push({ type: 'text', text: material });
    const apiReq = {
      model: env.MODEL || 'claude-opus-5-5',
      max_tokens: 2000,
      output_config: { effort: 'medium' },
      fallbacks: 'default',
      system: sys,
      messages: msgs
    };
    let reply = '', stop = '', usage = null;
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01' }, body: JSON.stringify(apiReq) });
      const out = await r.json();
      if (!r.ok) return json({ error: 'ai', reply: 'The coach could not answer just now. Use the hints on the page.' }, 200, origin);
      stop = out.stop_reason; usage = out.usage;
      reply = stop === 'refusal' ? 'Let us keep to the question. Look at your first line again: which formula did you start from?'
        : (out.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    } catch (e) { return json({ error: 'ai', reply: 'The coach could not answer just now. Use the hints on the page.' }, 200, origin); }

    try {
      await kv.put('log:' + d + ':' + crypto.randomUUID(), JSON.stringify({ t: new Date().toISOString(), device: device, code: clip(q.code, 60), pack: packName, rung: q.rung, messages: msgs, reply: reply, stop: stop, usage: usage }), { expirationTtl: 60 * 60 * 24 * 30 });
    } catch (e) { /* a missed log never blocks the learner */ }
    return json({ reply: reply }, 200, origin);
  }
};
