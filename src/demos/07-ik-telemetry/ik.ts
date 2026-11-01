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
  if (![origin.x, origin.y, target.x, target.y, lenA, lenB, elbowSign].every(Number.isFinite) ||
      lenA <= 0 || lenB <= 0) {
    throw new Error("IK requires finite coordinates and positive finite bone lengths.");
  }
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  const minReach = Math.abs(lenA - lenB);
  const maxReach = lenA + lenB;
  const reachable = distance >= minReach - 1e-6 && distance <= maxReach + 1e-6;
  const clamped = Math.max(minReach, Math.min(distance, maxReach));
  // Choose a stable heading even when the target coincides with the root.
  const heading = distance > 1e-8 ? Math.atan2(dy, dx) : 0;
  const cosShoulder = clamped > 1e-8
    ? (lenA * lenA + clamped * clamped - lenB * lenB) / (2 * lenA * clamped)
    : 1;
  const shoulderOffset = Math.acos(Math.min(1, Math.max(-1, cosShoulder)));
  const angleA = heading - shoulderOffset * (elbowSign >= 0 ? 1 : -1);
  const b = { x: origin.x + Math.cos(angleA) * lenA, y: origin.y + Math.sin(angleA) * lenA };
  const ux = distance > 1e-8 ? dx / distance : 1;
  const uy = distance > 1e-8 ? dy / distance : 0;
  const end = { x: origin.x + ux * clamped, y: origin.y + uy * clamped };
  const angleB = Math.atan2(end.y - b.y, end.x - b.x) - angleA;
  return { a: origin, b, end, reachable, angleA, angleB };
}
