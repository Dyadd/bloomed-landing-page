/* Five-to-six bar trend, bottom aligned. Reads as movement, not as a chart. */
interface Point {
  value: number;
  color: string;
}

interface Props {
  points: Point[];
  barWidth?: number;
  gap?: number;
  maxHeight?: number;
  radius?: number;
}

export default function Sparkline({ points, barWidth = 7, gap = 3, maxHeight = 30, radius = 3 }: Props) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap, height: maxHeight }}>
      {points.map((p, i) => (
        <span
          key={i}
          style={{ width: barWidth, height: Math.max(4, (p.value / max) * maxHeight), borderRadius: radius, background: p.color }}
        />
      ))}
    </div>
  );
}
