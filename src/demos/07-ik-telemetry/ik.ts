export interface IkResult {
  a: { x: number; y: number };
  b: { x: number; y: number };
  end: { x: number; y: number };
  reachable: boolean;
  angleA: number;
  angleB: number;
}

export function twoBoneIk(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  lenA: number,
  lenB: number,
  elbowSign = 1
): IkResult {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.min(lenA + lenB - 1e-4, Math.max(1e-4, Math.hypot(dx, dy)));
  const reachable = Math.hypot(dx, dy) <= lenA + lenB + 1e-6;
  const cosB = (lenA * lenA + lenB * lenB - dist * dist) / (2 * lenA * lenB);
  const angleB = Math.acos(Math.min(1, Math.max(-1, cosB))) * (elbowSign >= 0 ? 1 : -1);
  const cosA = (lenA * lenA + dist * dist - lenB * lenB) / (2 * lenA * dist);
  const base = Math.atan2(dy, dx);
  const angleA = base - Math.acos(Math.min(1, Math.max(-1, cosA))) * (elbowSign >= 0 ? 1 : -1);
  const b = { x: origin.x + Math.cos(angleA) * lenA, y: origin.y + Math.sin(angleA) * lenA };
  const end = { x: b.x + Math.cos(angleA + Math.PI - angleB) * lenB, y: b.y + Math.sin(angleA + Math.PI - angleB) * lenB };
  return { a: origin, b, end, reachable, angleA, angleB };
}
