"""Build the coach's topic packs (tutor/packs/<studio>-<topic>.txt) from material already in the site.
Run: python tutor/build_packs.py   (after: node tutor/slips.js > tutor/slips.json)
Every line in a pack carries its source, so the coach can name it. Nothing here is invented: SAGS wording is typed
from IEB SAGS 2025 (Sept 2024 update); the rest is lifted from the studio lessons, the exam trap cards and the
practice engines. 25 Nov 2026."""
import json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(p): return json.load(open(os.path.join(ROOT, p), encoding='utf-8'))

SAGS_C = 'IEB SAGS 2025 (updated Sept 2024), Physical Sciences, E. Electric Circuits, p. 29/36-29/37'
SAGS_M = 'IEB SAGS 2025 (updated Sept 2024), Physical Sciences, C. Momentum and Impulse, p. 29/31-29/32'
SAGS = {
 'ohm': [
  'Define potential difference as the work done per unit positive charge: V = W/q.',
  'Define current as the rate of flow of charge: I = q/t.',
  'Determine the relationship between current and potential difference at constant temperature.',
  "State Ohm's Law: The current through a conductor is directly proportional to the potential difference across the conductor at constant temperature.",
  'Distinguish between ohmic and non-ohmic conductors.',
  "Know that resistance is a material's opposition to the flow of electric charge. Know that the unit of resistance is the ohm (Ω).",
  'Calculate the effective resistance of resistors in series using RS = R1 + R2 + ...',
  'Calculate the effective resistance of resistors in parallel using 1/RP = 1/R1 + 1/R2 + ...',
  'Interpret circuit diagrams containing a source, switches, resistors, ammeters and voltmeters.',
  "Solve problems using the mathematical expression of Ohm's Law, R = V/I, for series and parallel circuits, limited to a maximum of three external resistors."],
 'power': [
  'Solve problems using electrical energy W = Pt. State that electrical energy is measured in joules (J).',
  'Know that electrical power dissipated in a device is equal to the product of the potential difference across the device and current flowing through it.',
  'Solve problems using P = VI or P = I²R or P = V²/R. Solve problems using W = VIt or W = I²Rt or W = V²t/R.',
  'Know that the kilowatt hour (kWh) is a unit of energy and that 1 kWh is the amount of energy used when 1 kilowatt of electricity is used for 1 hour.',
  'Perform calculations involving the cost of electricity usage when given relevant information.'],
 'emf': [
  'Solve problems involving current, potential difference and resistance for circuits containing arrangements of resistors in series and in parallel for a maximum of three external resistors.',
  'State that a real battery has internal resistance.',
  'Define emf as the total energy supplied per coulomb of charge by the cell.',
  'Know that the sum of the voltages across the external circuit plus the voltage across the internal resistance is equal to the emf: emf = Vload + Vinternal resistance or emf = I(Rext + r).',
  'Solve circuit problems in which the internal resistance of the battery must be considered, including series-parallel networks of resistors to a maximum of three external resistors.'],
 'momentum': [
  'Define linear momentum as the product of the mass and velocity of the object. Linear momentum is a vector in the same direction as the velocity. Calculate it in one dimension using p = mv.',
  "State Newton's second law in terms of momentum: The net force acting on an object is equal to the rate of change of momentum. Solve problems for constant mass using Fnet = Δp/Δt.",
  'Define impulse (J) as the product of the net force and the contact time; J = FnetΔt. Impulse is a vector in the same direction as the net force. Impulse and change in momentum are equivalent: FnetΔt = Δp.',
  'Apply the concept of impulse in everyday life (e.g. airbags, catching a hard ball).'],
 'conservation': [
  'An isolated system is one that has no net external force acting on it; explain internal and external forces.',
  'State the law of conservation of linear momentum: The total linear momentum of an isolated system remains constant (is conserved).',
  'Solve problems by applying the law of conservation of momentum to interactions of two objects moving in one dimension, with the aid of an appropriate sign convention.',
  'Define an elastic collision as a collision in which both momentum and kinetic energy are conserved. Define an inelastic collision as a collision in which only momentum is conserved. Identify elastic and inelastic collisions using calculations where necessary.']
}

# practice topic -> (lesson ids, trap card keys, SAGS blocks)
CIRC = {
 'T1': (['current'], ['m10/current'], ['ohm']), 'T2': (['ohm'], ['m10/ohm'], ['ohm']),
 'T3': (['series-parallel'], ['m10/series-parallel'], ['ohm']), 'T4': (['power'], ['m10/power'], ['power']),
 'T5': (['kwh'], ['m10/kwh'], ['power']), 'T6': (['networks'], ['m11/networks'], ['emf', 'ohm']),
 'T7': (['emf-r'], ['m11/emf-r'], ['emf']), 'T8': (['with-r'], ['m11/with-r'], ['emf']),
 'T10': (['graph-r'], ['m11/graph-r'], ['emf', 'ohm']), 'T11': (['ohm'], [], ['ohm'])}
MOM = {'M1': (['m7/momentum'], ['momentum']), 'M2': (['m7/conservation'], ['conservation'])}

def clean(s):
    s = re.sub(r'<[^>]+>', '', str(s)); s = s.replace('**', '')
    return re.sub(r'\s+', ' ', s).strip()

def lesson_lines(lid):
    L = load('circuits/data/learn/' + lid + '.json'); book = L.get('book', '')
    out = ['COURSEBOOK AND STUDIO LESSON: "' + clean(L.get('title', '')) + '" (' + book + ')']
    for sc in L.get('screens', []):
        t = sc.get('t')
        if t == 'read':
            out.append('- ' + clean(sc.get('h', '')) + ': ' + ' '.join(clean(p) for p in sc.get('p', [])) + ' (' + book + ')')
        elif t == 'we':
            lines = ' | '.join((clean(x.get('l', '')) + ' ' + clean(x.get('x', ''))).strip() for x in sc.get('lines', []))
            out.append('- Worked example, ' + clean(sc.get('h', '')) + ': ' + clean(sc.get('q', '')) + ' Answer: ' + lines + ' (' + (sc.get('src') or book) + ')')
        elif t == 'ask':
            why = clean(sc.get('why', ''))
            fb = [clean(c[2]) for c in sc.get('choices', []) if len(c) > 2 and not c[1] and c[2]]
            if why: out.append('- Check, "' + clean(sc.get('q', '')) + '": ' + why + ' (' + book + ')')
            for f in fb:
                if 'Examiners' in f or 'SAGS' in f: out.append('- Common wrong idea: ' + f)
        elif t == 'end':
            out.append('- By the end the learner can: ' + '; '.join(clean(c) for c in sc.get('can', [])) + ' (' + book + ')')
    return out

def trap_lines(keys, cards):
    out = []
    for k in keys:
        c = cards.get(k)
        if not c: continue
        ex = c.get('examiner') or {}
        out += ['EXAM TRAP: ' + clean(c['title']) + ' (' + clean(c.get('built_on', '')) + ')',
                '- Question: ' + clean(c['question']), '- The usual wrong answer: ' + clean(c['usual_wrong']),
                '- What went wrong: ' + clean(c['what_went_wrong']), '- The memo: ' + clean(c['memo'])]
        if ex.get('quote'): out.append('- The examiners, word for word: "' + clean(ex['quote']) + '" (' + clean(ex.get('source', '')) + ')')
    return out

MARKING = ["MR R'S MARKING (how the app and Mr R mark calculations)",
 '- Every calculation: formula ✓, substitution ✓, answer with unit ✓. A correct formula and substitution earn marks even when the answer is wrong. (Mr R\'s marking)',
 '- Follow-through: a wrong answer carried correctly into the next part is not punished twice. (Mr R\'s marking)',
 '- Start every calculation with a formula: "It is best practice to begin each calculation with an appropriate formula, which will be used to solve the problem." (IEB Examiners\' Report 2024, Paper 1)',
 '- Round final answers to 2 decimal places; use a decimal comma. (Mr R\'s marking)']
VEC = ['- Vectors: the learner chooses the positive direction first. The answer is a size, a unit and a direction, even when it is positive. Never a negative and a direction on the same line: the negative result on its own line, then the size with what the negative means. (Mr R\'s marking)']

def write(name, parts):
    ex = os.path.join(ROOT, 'tutor', 'examiners-' + name.split('-')[0] + '.txt')
    if os.path.exists(ex): parts = parts + ['', open(ex, encoding='utf-8').read()]
    txt ='\n'.join(parts).strip() + '\n'
    open(os.path.join(ROOT, 'tutor', 'packs', name + '.txt'), 'w', encoding='utf-8', newline='\n').write(txt)
    return len(txt)

cards = load('app/traps.json')['cards']; slips = load('tutor/slips.json'); sizes = {}
for t, (lids, tk, sb) in CIRC.items():
    name = 'circuits-' + t
    parts = ['TOPIC PACK ' + name + ' (Circuits Studio practice). Built 25 Nov 2026 from Mr R\'s material.', '', 'SAGS WORDING (' + SAGS_C + ')']
    for b in sb: parts += ['- ' + x for x in SAGS[b]]
    parts.append('')
    for lid in lids: parts += lesson_lines(lid) + ['']
    parts += trap_lines(tk, cards) + ['']
    parts += ['COMMON SLIPS the practice engine names (Mr R\'s practice engine)'] + ['- ' + s for s in slips.get(name, [])] + ['']
    parts += MARKING
    sizes[name] = write(name, parts)
for t, (tk, sb) in MOM.items():
    name = 'momentum-' + t
    parts = ['TOPIC PACK ' + name + ' (Momentum practice). Built 25 Nov 2026 from Mr R\'s material.', '', 'SAGS WORDING (' + SAGS_M + ')']
    for b in sb: parts += ['- ' + x for x in SAGS[b]]
    parts.append('')
    parts += trap_lines(tk, cards) + ['']
    parts += ['COMMON SLIPS the practice engine names (Mr R\'s practice engine)'] + ['- ' + s for s in slips.get(name, [])] + ['']
    parts += MARKING + VEC
    sizes[name] = write(name, parts)
print(sizes)
