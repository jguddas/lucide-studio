import getPaths from "../SvgPreview/utils";
import pathToPoints from "../SvgPreview/path-to-points";
import { nodesToSvg, pathToPathNode } from "./SvgEditor";
import { INode } from "svgson";
import format from "./format";
import memoize from "lodash/memoize";
import optimize from "./optimize";

const emptyState = format("");

async function offify(svg: string) {
  const height = parseInt(svg.match(/height="(\d+)"/)?.[1] ?? "24");
  const width = parseInt(svg.match(/width="(\d+)"/)?.[1] ?? "24");

  const mask = `M5.656 0 ${width} ${height - 24 + 18.344}V${height}L0 0z`;

  const url = new URL(`${global?.window?.location?.origin}/api/convert-svg`);
  url.searchParams.append("actions", ["select-all", "path-cut"].join(","));

  const inkscapeOutput = await fetch(url, {
    method: "POST",
    body: `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${width}"
        height="${height}"
        viewBox="0 0 ${width} ${height}"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="${getPaths(svg)
          .map(({ d }) => d)
          .join("")}" />
        <path d="${mask}" id="mask"/>
      </svg>
    `,
  }).then((r) => r.text());

  if (format(inkscapeOutput) === emptyState) {
    throw new Error(inkscapeOutput);
  }

  return optimize(
    nodesToSvg(
      [
        ...getPaths(format(inkscapeOutput))
          .filter((val) => {
            return pathToPoints(val).map(isPointOutsideLines).every(Boolean);
          })
          .map(pathToPathNode),
        {
          name: "path",
          value: "",
          children: [],
          type: "element",
          attributes: { d: `M2 2 L ${height - 2} ${width - 2}` },
        } as INode,
      ],
      height,
      width,
    ),
  );
}

function isPointOutsideLines(point: { x: number; y: number }) {
  const A = { x: 0.1, y: 0 };
  const B = { x: 5.5, y: 0 };
  const dx = 1;
  const dy = 1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / length;
  const dirY = dy / length;
  const normalX = -dirY;
  const normalY = dirX;
  function signedDistance(
    base: { x: number; y: number },
    px: number,
    py: number,
  ) {
    const vx = px - base.x;
    const vy = py - base.y;
    return vx * normalX + vy * normalY;
  }
  const d1 = signedDistance(A, point.x, point.y);
  const d2 = signedDistance(B, point.x, point.y);
  return !((d1 >= 0 && d2 <= 0) || (d1 <= 0 && d2 >= 0));
}

export default memoize(offify);
