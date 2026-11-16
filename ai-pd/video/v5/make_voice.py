"""Build Leah's narration phrase by phrase (Azure, en-ZA-LeahNeural), then one narration.wav + manifest.json with exact cue times."""
import json, pathlib, subprocess, sys, wave, numpy as np
HERE = pathlib.Path(__file__).parent; V = HERE / 'voice'; V.mkdir(exist_ok=True)
sys.path.insert(0, str(HERE)); from script import S, CAPTION
SAY = r'C:\Users\robenex001\tools\azure-speech\say.py'; PY = sys.executable
RATE, SR, LEAD, GAP = '+12%', 48000, 1.8, 2.0
def read(p):
    w = wave.open(str(p)); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768; return x
def trim(x, th=0.006, pad=0.03):
    idx = np.where(np.abs(x) > th)[0]
    if not len(idx): return x
    a = max(0, idx[0] - int(pad * SR)); b = min(len(x), idx[-1] + int(pad * SR)); return x[a:b]
out, cues, scenes, t, prev = [np.zeros(int(LEAD * SR), np.float32)], [], {}, LEAD, None
for i, (sc, cue, text, pause) in enumerate(S):
    f = V / f'{i:02d}-{sc}-{cue}.wav'
    if not f.exists():
        r = subprocess.run([PY, '-I', '-X', 'utf8', SAY, 'en-ZA-LeahNeural', str(f), text, RATE, 'en-ZA'], capture_output=True, text=True)
        if r.returncode: print('FAIL', cue, r.stderr[-300:]); sys.exit(1)
    if prev is not None and sc != prev:
        scenes[prev]['end'] = t; out.append(np.zeros(int(GAP * SR), np.float32)); t += GAP
    if sc not in scenes: scenes[sc] = {'start': t}
    x = trim(read(f)); d = len(x) / SR
    cues.append({'scene': sc, 'cue': cue, 'a': round(t, 3), 'b': round(t + d, 3), 'text': CAPTION.get(cue, text)})
    out.append(x); t += d
    pause = pause * 1.35 if pause else 0
    if pause: out.append(np.zeros(int(pause * SR), np.float32)); t += pause
    prev = sc
scenes[prev]['end'] = t
y = np.concatenate(out); y = y / np.abs(y).max() * 0.89
with wave.open(str(HERE / 'narration.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())
m = {'dur': round(t, 3), 'scenes': {str(k): {kk: round(vv, 3) for kk, vv in v.items()} for k, v in scenes.items()}, 'cues': cues}
(HERE / 'manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding='utf-8')
(HERE / 'manifest.js').write_text('window.NARR = ' + json.dumps(m, ensure_ascii=False) + ';\n', encoding='utf-8')
words = sum(len(c[2].split()) for c in S)
print('narration', round(t, 1), 's,', words, 'words,', round(words / t * 60), 'wpm overall')
for k, v in scenes.items(): print(' scene', k, round(v['start'], 1), '->', round(v['end'], 1), f"({v['end'] - v['start']:.1f}s)")
