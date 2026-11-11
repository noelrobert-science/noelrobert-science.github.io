/* Circuits Studio presets (studio_design.md §4.7). All Noel-authored; values recomputed by the solver tests.
   Lattice coordinates: x to the right, y down. A battery's a is its − terminal and b its + terminal.
   expect: readings to 2 decimal places, checked by test/solver.test.js for the start state and every event. */
(function (root) {
  'use strict';
  var IDEAL = 'The ammeters have negligible resistance, and the voltmeters have infinite resistance.';
  var P = [];

  /* ---------- A: the anchor network ---------- */
  function anchor(r, rh) {
    return {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: r },
        { id: 'S1', kind: 'switch', a: [0, 0], b: [0, 1], closed: true },
        { id: 'A1', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        { id: 'Rh', kind: 'rheostat', a: [1, 3], b: [3, 3], R: rh, Rmax: 10 },
        { id: 'A2', kind: 'ammeter', a: [4, 3], b: [5, 3] },
        { id: 'L', kind: 'bulb', a: [5, 3], b: [7, 3], R: 6, label: 'bulb' },
        { id: 'S2', kind: 'switch', a: [4, 4], b: [5, 4], closed: true },
        { id: 'R3', kind: 'resistor', a: [5, 4], b: [7, 4], R: 12 },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' },
        { id: 'V2', kind: 'voltmeter', a: [1, 3], b: [3, 3], side: 'up' },
        { id: 'V3', kind: 'voltmeter', a: [4, 4], b: [7, 4], side: 'down' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[4, 3], [4, 4]], [[7, 4], [7, 3], [7, 0], [4, 0]]]
    };
  }
  P.push({
    id: 'A', title: 'Circuit A: the anchor network', grades: [11, 12], book: '11.3',
    intro: 'A battery with internal resistance, a rheostat in the main line, and a bulb in parallel with a resistor.',
    spec: anchor(1, 3), r0: 'A10',
    expect: {
      start: { A1: 1.5, A2: 1.0, V1: 10.5, V2: 4.5, V3: 6.0, P_L: 6.0, I_R3: 0.5, lost_B: 1.5 },
      events: [
        { label: 'Open S2', set: { S2: { closed: false } }, expect: { A1: 1.2, A2: 1.2, V1: 10.8, V2: 3.6, V3: 7.2 } }
      ]
    }
  });
  P.push({
    id: 'A10', title: 'Circuit A on an ideal battery', grades: [10, 11, 12], book: '10.3',
    intro: 'Circuit A with an ideal battery (no internal resistance) and the rheostat at 4 Ω.',
    spec: anchor(0, 4),
    expect: {
      start: { A1: 1.5, A2: 1.0, V1: 12.0, V2: 6.0, V3: 6.0, P_L: 6.0 },
      events: [{ label: 'Open S2', set: { S2: { closed: false } }, expect: { A1: 1.2, V2: 4.8, V3: 7.2 } }]
    }
  });

  /* ---------- B: headlamps and starter motor ---------- */
  P.push({
    id: 'B', title: 'Circuit B: headlamps and a starter motor', grades: [11, 12], book: '11.2',
    intro: 'Two identical headlamps on S1 and a starter motor on S2, on a battery with internal resistance.',
    note: 'Values chosen for clear arithmetic. A real starter motor has a much smaller resistance.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 0.5 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'S1', kind: 'switch', a: [1, 2], b: [2, 2], closed: true },
        { id: 'L1', kind: 'bulb', a: [3, 2], b: [5, 2], R: 11, label: 'headlamp' },
        { id: 'L2', kind: 'bulb', a: [3, 3], b: [5, 3], R: 11, label: 'headlamp' },
        { id: 'S2', kind: 'switch', a: [1, 4], b: [2, 4], closed: false },
        { id: 'M', kind: 'motor', a: [3, 4], b: [5, 4], R: 9.625, label: 'starter motor' },
        { id: 'V', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[1, 2], [1, 4]], [[2, 2], [3, 2]], [[2, 2], [2, 3], [3, 3]],
        [[5, 2], [6, 2]], [[5, 3], [6, 3], [6, 2]], [[2, 4], [3, 4]], [[5, 4], [6, 4], [6, 3]], [[6, 2], [6, 0], [4, 0]]]
    },
    expect: {
      start: { A: 2.0, V: 11.0, I_L1: 1.0, P_L1: 11.0 },
      events: [
        { label: 'Close S2 (start the motor)', set: { S2: { closed: true } }, expect: { A: 3.0, V: 10.5, I_L1: 0.95, P_L1: 10.02, I_M: 1.09 } },
        { label: 'Open S1', set: { S1: { closed: false } }, expect: { A: 0, V: 12.0 } }
      ]
    }
  });

  /* ---------- B2: a series pair in a branch ---------- */
  P.push({
    id: 'B2', title: 'Circuit B2: a series pair in one branch', grades: [11, 12], book: '11.1',
    intro: '(4 Ω + 8 Ω) in parallel with 6 Ω, on a 9 V battery with r = 0,5 Ω.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 9, r: 0.5 },
        { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        { id: 'R1', kind: 'resistor', a: [1, 3], b: [3, 3], R: 4 },
        { id: 'R2', kind: 'resistor', a: [3, 3], b: [5, 3], R: 8 },
        { id: 'R3', kind: 'resistor', a: [2, 4], b: [5, 4], R: 6 },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ],
      wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[1, 3], [1, 4], [2, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]]
    },
    expect: { start: { A: 2.0, V1: 8.0, I_R1: 0.67, I_R3: 1.33 } }
  });

  /* ---------- C: a lamp added across the battery ---------- */
  P.push({
    id: 'C', title: 'Circuit C: a second lamp in parallel', grades: [10, 11, 12], book: '10.3',
    intro: 'L1 on a 6 V battery; S adds L2 in parallel. Try it with r = 0, then give the battery r = 1 Ω.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [3, 0], b: [1, 0], emf: 6, r: 0 },
        { id: 'L1', kind: 'bulb', a: [1, 2], b: [3, 2], R: 6 },
        { id: 'S', kind: 'switch', a: [0, 3], b: [1, 3], closed: false },
        { id: 'L2', kind: 'bulb', a: [1, 3], b: [3, 3], R: 6 },
        { id: 'A', kind: 'ammeter', a: [4, 1], b: [4, 0] },
        { id: 'V', kind: 'voltmeter', a: [3, 0], b: [1, 0], side: 'up' }
      ],
      wires: [[[1, 0], [0, 0], [0, 2], [1, 2]], [[0, 2], [0, 3]], [[3, 2], [4, 2]], [[3, 3], [4, 3], [4, 2]], [[4, 2], [4, 1]], [[4, 0], [3, 0]]]
    },
    expect: {
      start: { A: 1.0, V: 6.0, P_L1: 6.0 },
      events: [
        { label: 'Close S', set: { S: { closed: true } }, expect: { A: 2.0, V: 6.0, P_L1: 6.0 } },
        { label: 'r = 1 Ω, S open', set: { B: { r: 1 } }, expect: { A: 0.86, V: 5.14, P_L1: 4.41 } },
        { label: 'r = 1 Ω, S closed', set: { B: { r: 1 }, S: { closed: true } }, expect: { A: 1.5, V: 4.5, P_L1: 3.38 } }
      ]
    }
  });

  /* ---------- D: a series lamp before the junction ---------- */
  P.push({
    id: 'D', title: 'Circuit D: a lamp before the junction', grades: [10, 11, 12], book: '10.3',
    intro: 'Lamp X in series with lamp Y; S adds lamp Z across Y. All lamps 4 Ω, ideal 12 V battery.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 0 },
        { id: 'A', kind: 'ammeter', a: [0, 1], b: [0, 2] },
        { id: 'X', kind: 'bulb', a: [1, 3], b: [3, 3], R: 4 },
        { id: 'Y', kind: 'bulb', a: [4, 3], b: [6, 3], R: 4 },
        { id: 'S', kind: 'switch', a: [3, 4], b: [4, 4], closed: false },
        { id: 'Z', kind: 'bulb', a: [4, 4], b: [6, 4], R: 4 }
      ],
      wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[3, 3], [3, 4]], [[6, 3], [7, 3]], [[6, 4], [7, 4], [7, 3]], [[7, 3], [7, 0], [4, 0]]]
    },
    expect: {
      start: { A: 1.5, P_X: 9.0, P_Y: 9.0 },
      events: [
        { label: 'Close S', set: { S: { closed: true } }, expect: { A: 2.0, P_X: 16.0, P_Y: 4.0 } },
        { label: 'r = 1 Ω, S open', set: { B: { r: 1 } }, expect: { P_X: 7.11, P_Y: 7.11 } },
        { label: 'r = 1 Ω, S closed', set: { B: { r: 1 }, S: { closed: true } }, expect: { P_X: 11.76, P_Y: 2.94 } }
      ]
    }
  });

  /* ---------- D1: a switch across a lamp ---------- */
  P.push({
    id: 'D1', title: 'Circuit D1: a switch across a lamp', grades: [10, 11, 12], book: '10.3',
    intro: 'L1 and L2 (6 Ω each) in series on an ideal 12 V battery. Switch S is connected across L1.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 0 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'L1', kind: 'bulb', a: [1, 2], b: [3, 2], R: 6 },
        { id: 'L2', kind: 'bulb', a: [4, 2], b: [6, 2], R: 6 },
        { id: 'S', kind: 'switch', a: [1, 3], b: [3, 3], closed: false }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[3, 2], [4, 2]], [[1, 2], [1, 3]], [[3, 3], [3, 2]], [[6, 2], [6, 0], [4, 0]]]
    },
    expect: {
      start: { A: 1.0, P_L1: 6.0, P_L2: 6.0 },
      events: [{ label: 'Close S', set: { S: { closed: true } }, expect: { A: 2.0, P_L2: 24.0, P_L1: 0 } }]
    }
  });

  /* ---------- D2: a wire across a resistor ---------- */
  P.push({
    id: 'D2', title: 'Circuit D2: a wire across a resistor', grades: [11, 12], book: '11.3',
    intro: '2 Ω and 3 Ω in series on a 12 V battery with r = 1 Ω. Closing S joins the ends of the 3 Ω with a wire.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 1 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'R1', kind: 'resistor', a: [1, 2], b: [3, 2], R: 2 },
        { id: 'R2', kind: 'resistor', a: [4, 2], b: [6, 2], R: 3 },
        { id: 'S', kind: 'switch', a: [4, 3], b: [6, 3], closed: false, label: 'wire' },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[3, 2], [4, 2]], [[4, 2], [4, 3]], [[6, 3], [6, 2]], [[6, 2], [7, 2], [7, 0], [4, 0]]]
    },
    expect: {
      start: { A: 2.0, V1: 10.0 },
      events: [{ label: 'Close S', set: { S: { closed: true } }, expect: { A: 4.0, V1: 8.0 } }]
    }
  });

  /* ---------- E and E10: a rheostat after the bulb ---------- */
  function seriesRh(emf, r, bulb) {
    return {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: emf, r: r },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'L', kind: 'bulb', a: [1, 2], b: [3, 2], R: bulb },
        { id: 'Rh', kind: 'rheostat', a: [4, 2], b: [6, 2], R: 3, Rmax: 10 },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[3, 2], [4, 2]], [[6, 2], [6, 0], [4, 0]]]
    };
  }
  P.push({
    id: 'E', title: 'Circuit E: a rheostat after the bulb', grades: [11, 12], book: '11.5',
    intro: 'The rheostat comes after the bulb, in the direction of conventional current. Does that matter?',
    spec: seriesRh(12, 1, 8),
    expect: {
      start: { A: 1.0, V1: 11.0, P_L: 8.0 },
      events: [{ label: 'Rheostat 3 Ω → 5 Ω', set: { Rh: { R: 5 } }, expect: { A: 0.86, V1: 11.14, P_L: 5.88 } }]
    }
  });
  P.push({
    id: 'E10', title: 'Circuit E on an ideal battery', grades: [10, 11, 12], book: '10.3',
    intro: 'A bulb and then a rheostat, on an ideal 12 V battery.',
    spec: seriesRh(12, 0, 9),
    expect: {
      start: { A: 1.0, V1: 12.0, P_L: 9.0 },
      events: [{ label: 'Rheostat 3 Ω → 5 Ω', set: { Rh: { R: 5 } }, expect: { A: 0.86, P_L: 6.61 } }]
    }
  });

  /* ---------- g10-bulbs ---------- */
  P.push({
    id: 'g10-bulbs', title: 'Bulbs and two switched branches', grades: [10, 11, 12], book: '10.3',
    intro: 'Bulb P in the main line, then bulb M (switch S1) in parallel with bulb N (switch S2). Every bulb is 6 Ω; ideal 12 V battery.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 0 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'P', kind: 'bulb', a: [0, 1], b: [0, 3], R: 6 },
        { id: 'S1', kind: 'switch', a: [1, 3], b: [2, 3], closed: true },
        { id: 'M', kind: 'bulb', a: [3, 3], b: [5, 3], R: 6 },
        { id: 'S2', kind: 'switch', a: [1, 4], b: [2, 4], closed: false },
        { id: 'N', kind: 'bulb', a: [3, 4], b: [5, 4], R: 6 },
        { id: 'V', kind: 'voltmeter', a: [1, 4], b: [2, 4], side: 'down' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 3], [1, 3]], [[1, 3], [1, 4]], [[2, 3], [3, 3]], [[2, 4], [3, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]]
    },
    expect: {
      start: { A: 1.0, P_P: 6.0, P_M: 6.0, V: 6.0 },
      events: [
        { label: 'Close S2', set: { S2: { closed: true } }, expect: { A: 1.33, P_P: 10.67, P_M: 2.67, P_N: 2.67, V: 0 } },
        { label: 'Open S1 and S2', set: { S1: { closed: false } }, expect: { A: 0, V: 12.0 } }
      ]
    }
  });

  /* ---------- series resistor, then a parallel pair (g10-B, g10-C) ---------- */
  function seriesPar(emf, r, Rs, R1, R2) {
    return {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: emf, r: r },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'Rs', kind: 'resistor', a: [0, 1], b: [0, 3], R: Rs },
        { id: 'A1', kind: 'ammeter', a: [2, 3], b: [3, 3] },
        { id: 'R1', kind: 'resistor', a: [3, 3], b: [5, 3], R: R1 },
        { id: 'A2', kind: 'ammeter', a: [2, 4], b: [3, 4] },
        { id: 'R2', kind: 'resistor', a: [3, 4], b: [5, 4], R: R2, lside: 'up' },
        { id: 'V1', kind: 'voltmeter', a: [0, 1], b: [0, 3], side: 'left' },
        { id: 'V2', kind: 'voltmeter', a: [1, 4], b: [6, 4], side: 'down' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 3], [1, 3], [2, 3]], [[1, 3], [1, 4], [2, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]]
    };
  }
  P.push({
    id: 'g10-B', title: 'A series resistor and a parallel pair (6 V)', grades: [10, 11, 12], book: '10.3',
    intro: '1 Ω in series with (6 Ω ∥ 3 Ω), on an ideal 6 V battery.',
    spec: seriesPar(6, 0, 1, 6, 3),
    expect: { start: { A: 2.0, V1: 2.0, V2: 4.0, A1: 0.67, A2: 1.33 } }
  });
  P.push({
    id: 'g10-C', title: 'A series resistor and a parallel pair (16 V)', grades: [10, 11, 12], book: '10.3',
    intro: '2 Ω in series with (10 Ω ∥ 15 Ω), on an ideal 16 V battery.',
    spec: seriesPar(16, 0, 2, 10, 15),
    expect: { start: { A: 2.0, V1: 4.0, V2: 12.0, A1: 1.2, A2: 0.8 } }
  });

  /* ---------- series3 and par2 ---------- */
  P.push({
    id: 'series3', title: 'Three resistors in series', grades: [10, 11, 12], book: '10.3',
    intro: '2 Ω, 4 Ω and 6 Ω in series on an ideal 9 V battery, with a voltmeter across each.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [5, 0], b: [3, 0], emf: 9, r: 0 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'R1', kind: 'resistor', a: [1, 2], b: [3, 2], R: 2 },
        { id: 'R2', kind: 'resistor', a: [3, 2], b: [5, 2], R: 4 },
        { id: 'R3', kind: 'resistor', a: [5, 2], b: [7, 2], R: 6 },
        { id: 'V1', kind: 'voltmeter', a: [1, 2], b: [3, 2], side: 'down' },
        { id: 'V2', kind: 'voltmeter', a: [3, 2], b: [5, 2], side: 'down' },
        { id: 'V3', kind: 'voltmeter', a: [5, 2], b: [7, 2], side: 'down' }
      ],
      wires: [[[3, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[7, 2], [7, 0], [5, 0]]]
    },
    expect: { start: { A: 0.75, V1: 1.5, V2: 3.0, V3: 4.5 } }
  });
  P.push({
    id: 'par2', title: 'Two resistors in parallel', grades: [10, 11, 12], book: '10.3',
    intro: '4 Ω in parallel with 12 Ω on an ideal 6 V battery, with an ammeter in each branch.',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 6, r: 0 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'A1', kind: 'ammeter', a: [1, 2], b: [2, 2] },
        { id: 'R1', kind: 'resistor', a: [2, 2], b: [4, 2], R: 4 },
        { id: 'A2', kind: 'ammeter', a: [1, 3], b: [2, 3] },
        { id: 'R2', kind: 'resistor', a: [2, 3], b: [4, 3], R: 12 }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[0, 2], [0, 3], [1, 3]], [[4, 2], [5, 2]], [[4, 3], [5, 3], [5, 2]], [[5, 2], [5, 0], [4, 0]]]
    },
    expect: { start: { A: 2.0, A1: 1.5, A2: 0.5 } }
  });

  /* ---------- twins of IEB questions (Noel-authored numbers) ---------- */
  P.push({
    id: 'twin-24N9', title: 'A bulb in parallel with a switched branch', grades: [11, 12], book: '11.3',
    intro: '18 V battery with r = 1,0 Ω; 12 Ω in the main line; a 30 Ω bulb in parallel with (S + A2 + 20 Ω).',
    src: 'Noel-authored twin of IEB 2024 Nov Q9',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 18, r: 1 },
        { id: 'A1', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'R', kind: 'resistor', a: [0, 1], b: [0, 3], R: 12 },
        { id: 'L', kind: 'bulb', a: [2, 3], b: [5, 3], R: 30 },
        { id: 'S', kind: 'switch', a: [1, 4], b: [2, 4], closed: true, lside: 'up' },
        { id: 'A2', kind: 'ammeter', a: [2, 4], b: [3, 4] },
        { id: 'R2', kind: 'resistor', a: [3, 4], b: [5, 4], R: 20 },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' },
        { id: 'V2', kind: 'voltmeter', a: [0, 1], b: [0, 3], side: 'left' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 3], [1, 3], [2, 3]], [[1, 3], [1, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]]
    },
    expect: {
      start: { A1: 0.72, A2: 0.43, V1: 17.28, V2: 8.64 },
      events: [{ label: 'Open S', set: { S: { closed: false } }, expect: { A1: 0.42, A2: 0, V1: 17.58, V2: 5.02, P_L: 5.26 } }]
    }
  });
  P.push({
    id: 'twin-25N8', title: 'Two switched branches', grades: [11, 12], book: '11.3',
    intro: '9 V battery with r = 0,5 Ω; (3 Ω + S1 + 9 Ω) in parallel with (6 Ω + S2).',
    src: 'Noel-authored twin of IEB 2025 Nov Q8',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 9, r: 0.5 },
        { id: 'A', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'R1', kind: 'resistor', a: [1, 2], b: [2, 2], R: 3 },
        { id: 'S1', kind: 'switch', a: [2, 2], b: [3, 2], closed: true },
        { id: 'R2', kind: 'resistor', a: [3, 2], b: [5, 2], R: 9 },
        { id: 'R3', kind: 'resistor', a: [1, 3], b: [3, 3], R: 6 },
        { id: 'S2', kind: 'switch', a: [3, 3], b: [5, 3], closed: true },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2]], [[1, 2], [1, 3]], [[5, 2], [6, 2]], [[5, 3], [6, 3], [6, 2]], [[6, 2], [6, 0], [4, 0]]]
    },
    expect: {
      start: { A: 2.0, V1: 8.0 },
      events: [{ label: 'Open S2', set: { S2: { closed: false } }, expect: { A: 0.72, V1: 8.64 } }]
    }
  });
  P.push({
    id: 'twin-23M7', title: 'A resistor, then a bulb in parallel with a resistor', grades: [11, 12], book: '11.3',
    intro: '24 V battery with r = 1,0 Ω; 8 Ω in the main line; a 4 Ω bulb in parallel with (12 Ω + A2).',
    src: 'Noel-authored twin of IEB May 2023 Q7',
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 24, r: 1 },
        { id: 'A1', kind: 'ammeter', a: [0, 0], b: [0, 1] },
        { id: 'R8', kind: 'resistor', a: [0, 1], b: [0, 3], R: 8 },
        { id: 'L', kind: 'bulb', a: [2, 3], b: [5, 3], R: 4 },
        { id: 'A2', kind: 'ammeter', a: [1, 4], b: [2, 4] },
        { id: 'R12', kind: 'resistor', a: [2, 4], b: [5, 4], R: 12 },
        { id: 'V1', kind: 'voltmeter', a: [4, 0], b: [2, 0], side: 'up' },
        { id: 'V2', kind: 'voltmeter', a: [1, 4], b: [6, 4], side: 'down' }
      ],
      wires: [[[2, 0], [0, 0]], [[0, 3], [1, 3], [2, 3]], [[1, 3], [1, 4]], [[5, 3], [6, 3]], [[5, 4], [6, 4], [6, 3]], [[6, 3], [6, 0], [4, 0]]]
    },
    expect: { start: { A1: 2.0, A2: 0.5, V1: 22.0, V2: 6.0, P_R8: 32.0 } }
  });

  /* ---------- meters: the book's WE 10.4 circuit (10.3 virtual-lab box) ---------- */
  P.push({
    id: 'meters', title: 'Meters: where they go and what they read', grades: [10, 11, 12], book: '10.3',
    intro: 'A 9 V battery of negligible internal resistance; S, 4 Ω, 8 Ω and ammeter A in series; V1 across the 8 Ω and V2 across S.',
    tasks: ['Predict V1 and V2 with S open, then check.', 'Close S. Predict, then check.', 'Move the ammeter into V1’s place. Predict, check and explain.'],
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 9, r: 0 },
        { id: 'S', kind: 'switch', a: [0, 1], b: [0, 2], closed: false },
        { id: 'R1', kind: 'resistor', a: [1, 3], b: [3, 3], R: 4 },
        { id: 'R2', kind: 'resistor', a: [4, 3], b: [6, 3], R: 8 },
        { id: 'A', kind: 'ammeter', a: [7, 2], b: [7, 1] },
        { id: 'V1', kind: 'voltmeter', a: [4, 3], b: [6, 3], side: 'down' },
        { id: 'V2', kind: 'voltmeter', a: [0, 1], b: [0, 2], side: 'left' },
        { id: 'AV', kind: 'switch', a: [4, 4], b: [6, 4], closed: false, label: 'ammeter in V1’s place', hidden: true }
      ],
      wires: [[[2, 0], [0, 0], [0, 1]], [[0, 2], [0, 3], [1, 3]], [[3, 3], [4, 3]], [[6, 3], [7, 3], [7, 2]], [[7, 1], [7, 0], [4, 0]], [[4, 3], [4, 4]], [[6, 4], [6, 3]]]
    },
    expect: {
      start: { A: 0, V1: 0, V2: 9.0 },
      events: [
        { label: 'Close S', set: { S: { closed: true } }, expect: { A: 0.75, V1: 6.0, V2: 0 } },
        { label: 'S closed, the ammeter across the 8 Ω', set: { S: { closed: true }, AV: { closed: true } }, expect: { A: 2.25 } }
      ]
    }
  });

  /* ---------- loading: real meters (Gr 12) ---------- */
  P.push({
    id: 'loading', title: 'Meter loading: a real voltmeter', grades: [12], book: '11.4',
    intro: '12 V across 1 kΩ + 1 kΩ in series, with a voltmeter across one. Switch on real meters and set the voltmeter to 1 kΩ.',
    realOnly: true,
    spec: {
      parts: [
        { id: 'B', kind: 'battery', a: [4, 0], b: [2, 0], emf: 12, r: 0 },
        { id: 'R1', kind: 'resistor', a: [0, 1], b: [0, 3], R: 1000 },
        { id: 'R2', kind: 'resistor', a: [2, 3], b: [4, 3], R: 1000 },
        { id: 'V', kind: 'voltmeter', a: [2, 3], b: [4, 3], side: 'down' }
      ],
      wires: [[[2, 0], [0, 0], [0, 1]], [[0, 3], [2, 3]], [[4, 3], [5, 3], [5, 0], [4, 0]]]
    },
    expect: { start: { V: 6.0 } }
  });

  var api = { list: P, IDEAL: IDEAL, byId: function (id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.STUDIO = root.STUDIO || {}; root.STUDIO.presets = api; }
})(this);
