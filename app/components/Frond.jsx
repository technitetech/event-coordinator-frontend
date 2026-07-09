// Hand-drawn traveler's-palm frond, generated as line art.
// The recurring signature motif across the site.

export default function Frond({ stroke = "currentColor", opacity = 1 }) {
  const leaflets = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);          // 0 -> 1 along the stem
    const y = 20 + t * 260;             // position down the central stem
    const len = 90 * Math.sin(t * Math.PI) + 26; // longest in the middle
    const droop = 18 + t * 26;
    // left leaflet
    leaflets.push(
      <path
        key={`l${i}`}
        d={`M100 ${y} Q ${100 - len * 0.6} ${y - 6} ${100 - len} ${y + droop}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    );
    // right leaflet
    leaflets.push(
      <path
        key={`r${i}`}
        d={`M100 ${y} Q ${100 + len * 0.6} ${y - 6} ${100 + len} ${y + droop}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    );
  }
  return (
    <svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" style={{ opacity }} aria-hidden="true">
      {/* central stem */}
      <path d="M100 8 C 98 120 102 220 100 312" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      {leaflets}
    </svg>
  );
}
