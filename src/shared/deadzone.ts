export function scaledRadialDeadzone(
  x: number,
  y: number,
  deadzone = 0.18
): { x: number; y: number } {
  const magnitude = Math.hypot(x, y);
  if (magnitude < deadzone || magnitude === 0) return { x: 0, y: 0 };
  const scaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
  const factor = scaled / magnitude;
  return { x: x * factor, y: y * factor };
}

export function sampleGamepadAxes(
  pads: Array<Gamepad | null>,
  deadzone = 0.18
): { x: number; y: number; jump: boolean } {
  const pad = pads.find((item): item is Gamepad => item !== null && item.connected);
  if (!pad) return { x: 0, y: 0, jump: false };
  const stick = scaledRadialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, deadzone);
  const jump = Boolean(pad.buttons[0]?.pressed);
  return { x: stick.x, y: stick.y, jump };
}
