import { Point } from "@/lib/get-paths";

export function getOffsetLine(
  { x: Ax, y: Ay }: Point,
  { x: Bx, y: By }: Point,
  offset: number,
): [Point, Point] {
  let dx = Bx - Ax;
  let dy = By - Ay;

  // Normalize the difference
  const mag = Math.sqrt(dx * dx + dy * dy);
  dx /= mag;
  dy /= mag;

  // Perpendicular direction (rotated 90 degrees counter-clockwise)
  const pdx = -dy;
  const pdy = dx;

  // Offset points
  const offsetAx = Ax + offset * pdx;
  const offsetAy = Ay + offset * pdy;
  const offsetBx = Bx + offset * pdx;
  const offsetBy = By + offset * pdy;

  return [
    { x: offsetAx, y: offsetAy },
    { x: offsetBx, y: offsetBy },
  ];
}