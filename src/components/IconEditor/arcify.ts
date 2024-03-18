import { Point } from "../SvgPreview/types";
import getPaths from "../SvgPreview/utils";
// @ts-ignore
import { SVGPathData } from "svg-pathdata";
import optimize from "./optimize";
import path from "path";

function getOffsetLine(
  { x: Ax, y: Ay }: Point,
  { x: Bx, y: By }: Point,
  offset: number,
): [Point, Point] {
  let dx = Bx - Ax;
  let dy = By - Ay;

  // Normalize the difference
  let mag = Math.sqrt(dx * dx + dy * dy);
  dx /= mag;
  dy /= mag;

  // Perpendicular direction (rotated 90 degrees counter-clockwise)
  let pdx = -dy;
  let pdy = dx;

  // Offset points
  let offsetAx = Ax + offset * pdx;
  let offsetAy = Ay + offset * pdy;
  let offsetBx = Bx + offset * pdx;
  let offsetBy = By + offset * pdy;

  return [
    { x: offsetAx, y: offsetAy },
    { x: offsetBx, y: offsetBy },
  ];
}

const getIntersection = ([a, b]: [Point, Point], [c, d]: [Point, Point]) => {
  const denominator = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);
  if (denominator === 0) return null;
  const ua =
    ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denominator;
  const ub =
    ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denominator;
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
  return {
    x: a.x + ua * (b.x - a.x),
    y: a.y + ua * (b.y - a.y),
  };
};

const getOffsetIntersection = (
  [a1, a2]: [Point, Point],
  [b1, b2]: [Point, Point],
  offset: number,
) => {
  for (const o of [
    [-offset, -offset, 0],
    [-offset, offset, 1],
    [offset, -offset, 0],
    [offset, offset, 1],
  ]) {
    const intersection = getIntersection(
      getOffsetLine(a1, a2, o[0]),
      getOffsetLine(b1, b2, o[1]),
    );
    if (intersection) return { ...intersection, sweep: o[2] };
  }
};

const getClosestPointOnLine = (point: Point, line: [Point, Point]) => {
  const [a, b] = line;
  const ap = { x: point.x - a.x, y: point.y - a.y };
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ab2 = ab.x * ab.x + ab.y * ab.y;
  const ap_ab = ap.x * ab.x + ap.y * ab.y;
  const t = ap_ab / ab2;
  return {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
  };
};

export default function arcify(svg: string) {
  const paths = getPaths(optimize(svg)).map((path) => ({ ...path }));

  const newArcs = [];

  for (let idx = 0; idx < paths.length; idx++) {
    const path = paths[idx];

    if (
      ![
        SVGPathData.LINE_TO,
        SVGPathData.HORIZ_LINE_TO,
        SVGPathData.VERT_LINE_TO,
        SVGPathData.CLOSE_PATH,
      ].includes(path.c.type)
    ) {
      continue;
    }

    const prevPathIdx = path.isStart
      ? paths.findLastIndex((val) => val.c.id === path.c.id)
      : idx - 1;

    const prevPath = paths[prevPathIdx];

    if (
      !prevPath ||
      !prevPath.c.idx === path.c.idx ||
      ![
        SVGPathData.LINE_TO,
        SVGPathData.HORIZ_LINE_TO,
        SVGPathData.VERT_LINE_TO,
        SVGPathData.CLOSE_PATH,
      ].includes(prevPath.c.type)
    ) {
      continue;
    }

    const distance = Math.sqrt(
      (path.prev.x - prevPath.next.x) ** 2 +
        (path.prev.y - prevPath.next.y) ** 2,
    );

    if (distance > 0.01) continue;

    if (prevPath.c.id !== path.c.id) continue;

    const deg = ((a: Point, b: Point, c: Point) => {
      const ab = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      const bc = Math.sqrt((b.x - c.x) ** 2 + (b.y - c.y) ** 2);
      const ac = Math.sqrt((a.x - c.x) ** 2 + (a.y - c.y) ** 2);
      return (
        Math.acos((ab ** 2 + bc ** 2 - ac ** 2) / (2 * ab * bc)) *
        (180 / Math.PI)
      );
    })(prevPath.prev, path.prev, path.next);

    const radius = deg > 120 ? 2 : deg > 60 ? 1 : 0.5;

    const intersection = getOffsetIntersection(
      [prevPath.prev, path.prev],
      [path.prev, path.next],
      radius,
    );
    if (!intersection) continue;
    const closestPointOnLineA = getClosestPointOnLine(intersection, [
      prevPath.prev,
      path.prev,
    ]);
    const closestPointOnLineB = getClosestPointOnLine(intersection, [
      path.prev,
      path.next,
    ]);

    newArcs.push(
      `<path d="M${closestPointOnLineA.x} ${closestPointOnLineA.y}A ${radius} ${radius} 0 0 ${intersection.sweep} ${closestPointOnLineB.x} ${closestPointOnLineB.y}"/>`,
    );

    path.prev = closestPointOnLineB;
    paths[prevPathIdx].next = closestPointOnLineA;
  }
  if (!newArcs.length) return svg;
  return optimize(
    [
      ...newArcs,
      ...paths.map((path) => {
        if (
          ![
            SVGPathData.LINE_TO,
            SVGPathData.HORIZ_LINE_TO,
            SVGPathData.VERT_LINE_TO,
            SVGPathData.CLOSE_PATH,
          ].includes(path.c.type)
        ) {
          return `<path d="${path.d}"/>`;
        }

        return `<path d="M${path.prev.x} ${path.prev.y} ${path.next.x} ${path.next.y}"/>`;
      }),
    ].join("\n"),
  );
}
