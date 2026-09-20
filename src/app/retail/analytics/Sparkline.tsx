// Tiny inline-SVG sparkline for the KPI cards. Pure SVG (no recharts) so it
// server-renders with the card and adds nothing to the client bundle.
export function Sparkline({ points, color = "var(--accent)", height = 30 }: { points: number[]; color?: string; height?: number }) {
  if (points.length < 2) return null;
  const w = 100;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const y = (v: number) => height - ((v - min) / range) * (height - 4) - 2;
  const line = points.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const area = `0,${height} ${line} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" className="block">
      <polyline className="spark-area" points={area} fill={color} fillOpacity={0.1} stroke="none" />
      {/* pathLength=1 normalises the length so the CSS draw-in works regardless of data */}
      <polyline className="spark-line" points={line} pathLength={1} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
