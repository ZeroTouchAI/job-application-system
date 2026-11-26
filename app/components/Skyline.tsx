/** Stylised Toronto skyline used behind the landing hero and the sign-in pages. */
const BUILDINGS: [number, number, number][] = [
  [0, 70, 110], [78, 46, 150], [130, 60, 95], [196, 40, 170], [242, 70, 120], [320, 50, 90],
  [380, 44, 140], [430, 80, 105], [520, 46, 160], [572, 60, 100], [700, 54, 150], [760, 70, 110],
  [838, 44, 175], [888, 70, 120], [966, 54, 95], [1026, 66, 150], [1100, 100, 115],
];

export default function Skyline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b6cff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#5b43e6" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {BUILDINGS.map(([x, w, h], i) => (
        <rect key={i} x={x} y={240 - h} width={w} height={h} fill="url(#lp-sky)" opacity={0.75} />
      ))}
      <rect x="630" y="40" width="9" height="200" fill="url(#lp-sky)" />
      <ellipse cx="634.5" cy="112" rx="22" ry="9" fill="url(#lp-sky)" />
      <rect x="633" y="8" width="3" height="40" fill="url(#lp-sky)" />
      <path d="M0 240V218c180-26 380-30 600-14s420 24 600 8v28z" fill="#5b43e6" opacity="0.35" />
    </svg>
  );
}
