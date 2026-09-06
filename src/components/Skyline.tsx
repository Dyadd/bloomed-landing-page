/* The decorative row of stacked cells that closes the marketing site.
   Heights and the accent pattern are STATIC by design - a fresh random draw
   each build is not what was designed. */
const HEIGHTS = [2, 1, 3, 2, 4, 1, 2, 5, 3, 2, 1, 4, 6, 2, 3, 1, 2, 4, 3, 5, 2, 1, 3, 6, 4, 2, 1, 3, 2, 4, 5, 2, 3, 1, 4, 2, 6, 3, 2, 5, 1, 3, 4, 2, 1, 3];
const GREENS = ['#d3fa70', '#c3d778', '#d3fa70', '#c9e48a', '#d3fa70', '#b8ce70'];
const ACCENTS = ['#cb7365', '#d69a5f', '#d8c56c'];

function seeded() {
  let s = 7;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const CELL = 15;
const GAP = 5;
const HEIGHT = 112;

const rand = seeded();
const COLUMNS = HEIGHTS.map((h, ci) =>
  Array.from({ length: h }, (_, ri) => {
    const accent = ri < 2 && rand() < 0.34;
    return accent ? ACCENTS[Math.floor(rand() * 3)] : GREENS[(ci + ri) % 6];
  }),
);

export default function Skyline() {
  return (
    <div
      className="skyline"
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: GAP, height: HEIGHT, overflow: 'hidden' }}
    >
      {COLUMNS.map((rows, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column-reverse', gap: GAP - 1, width: CELL, flexShrink: 0 }}>
          {rows.map((c, ri) => (
            <span key={ri} style={{ height: CELL, borderRadius: 'var(--radius-cell)', background: c }} />
          ))}
        </div>
      ))}
    </div>
  );
}
