# Mr R's study coach: the small server

`worker.js` is a one-file Cloudflare Worker. It sits between the site and the AI, so the AI key is never in a public page.

**Status (25 Nov 2026):** private test. The coach panel only shows in a browser that has opened a practice page with `?coach=1`; `?coach=0` turns it off. Nothing links to it.

## What it does
- Accepts requests only from mrrscience.co.za (and this computer's local copy for testing).
- Adds the coach's rules and the question's material, then asks Claude (Opus 5.5 by default).
- Caps: 30 turns per device per day, 300 turns a day for everyone together. A monthly spending limit is also set in the Anthropic account.
- Off switch: set the variable `COACH_ON` to anything other than `1`. It takes effect at once.
- Logs each turn for 30 days for Noel's review: a random device code, the question code, the conversation and the reply. No name, no school, no IP address.

## Setting it up (once)
1. **Anthropic account** (Noel): add credit, set a monthly spend limit, create an API key named `mr-r-coach`. Copy it; don't paste it anywhere else.
2. **Cloudflare** (Noel signs in; Claude does the rest): create a Worker named `mr-r-coach`, paste `worker.js`, create a KV namespace `COACH_KV` and bind it, set `COACH_ON` = `1`.
3. **The key** (Noel only): Worker > Settings > Variables and secrets > add a **Secret** named `ANTHROPIC_API_KEY`, paste the key, save.
4. Put the Worker's address into `SERVER` at the top of `circuits/js/coach.js`.

## Testing without the AI
Open a practice page with `?coach=1&coachurl=mock`: a pretend coach answers, so the panel can be tested at no cost.
