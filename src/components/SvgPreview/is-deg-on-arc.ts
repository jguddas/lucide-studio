import { Path } from "./types";

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function isDegOnArc(deg: number, arc: Path): boolean {
  // 1. Basic values
  const { prev, c, circle } = arc;
  if (!circle) return false;
  const { x: x0, y: y0 } = prev; // start point
  const { x: x1, y: y1 } = c; // end point
  const { x: cx, y: cy, r } = circle;
  const { lArcFlag, sweepFlag, xRot } = c;
  const isEllipse = c.rX !== c.rY || xRot !== 0;

  // Only ellipse center arcs supported (circle ellipse arc).
  // 2. Compute the angle to the start and end points from center
  function angleFromCenter(x: number, y: number): number {
    let dx = x - cx,
      dy = y - cy;
    if (isEllipse) {
      // Apply rotation and ellipse axes for true angle
      const theta = (xRot * Math.PI) / 180;
      const cos = Math.cos(-theta),
        sin = Math.sin(-theta);
      const ex = (dx * cos - dy * sin) / c.rX;
      const ey = (dx * sin + dy * cos) / c.rY;
      return normalizeDeg((Math.atan2(ey, ex) * 180) / Math.PI);
    }
    return normalizeDeg((Math.atan2(dy, dx) * 180) / Math.PI);
  }

  const startAngle = angleFromCenter(x0, y0);
  const endAngle = angleFromCenter(x1, y1);
  const theta = normalizeDeg(deg);

  // 3. Compute arc angular span (SVG arc sweep)
  let deltaAngle = endAngle - startAngle;
  if (sweepFlag) {
    if (deltaAngle < 0) deltaAngle += 360;
  } else {
    if (deltaAngle > 0) deltaAngle -= 360;
  }
  // Use large-arc-flag to possibly go the "long way" around the circle
  if (lArcFlag === 1) {
    if (sweepFlag && deltaAngle < 180) deltaAngle += 360;
    if (!sweepFlag && deltaAngle > -180) deltaAngle -= 360;
  } else {
    if (sweepFlag && deltaAngle > 180) deltaAngle -= 360;
    if (!sweepFlag && deltaAngle < -180) deltaAngle += 360;
  }
  const arcStart = startAngle;
  const arcEnd = normalizeDeg(startAngle + deltaAngle);

  // 4. Is theta in swept region?
  const isOnArc = (() => {
    if (deltaAngle === 0) return false; // degenerate
    if (sweepFlag) {
      if (arcStart < arcEnd) return theta >= arcStart && theta <= arcEnd;
      else return theta >= arcStart || theta <= arcEnd;
    } else {
      if (arcStart > arcEnd) return theta <= arcStart && theta >= arcEnd;
      else return theta <= arcStart || theta >= arcEnd;
    }
  })();

  return isOnArc;
}
