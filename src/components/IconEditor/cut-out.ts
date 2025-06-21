import memoize from "lodash/memoize";
import getPaths from "../SvgPreview/utils";
import format from "./format";
import pathToPoints from "../SvgPreview/path-to-points";
import optimize, { isDistanceSmaller } from "./optimize";
import { nodesToSvg, pathToPathNode } from "./SvgEditor";
import { Path } from "../SvgPreview/types";

const emptyState = format("");

async function cutOut(svg: string, selected: Path[]) {
  const height = parseInt(svg.match(/height="(\d+)"/)?.[1] ?? "24");
  const width = parseInt(svg.match(/width="(\d+)"/)?.[1] ?? "24");

  const url = new URL(`${global?.window?.location?.origin}/api/convert-svg`);
  url.searchParams.append(
    "actions",
    [
      "select-by-selector:.mask",
      "object-stroke-to-path",
      "path-combine",
      "select-all",
      "path-cut",
    ].join(","),
  );

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
            .filter(({ c }) =>
              selected.some((s) => !(s.c.id === c.id && s.c.idx === c.idx)),
            )
            .map(({ d }) => d)
            .join(" ")}" />
          ${selected
            .map(
              ({ d }) =>
                `<path d="${d}" class="mask" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
            )
            .join("\n")}
        </svg>
      `,
  }).then((r) => r.text());

  if (format(inkscapeOutput) === emptyState) {
    throw new Error(inkscapeOutput);
  }

  const selectionPoints = selected.flatMap((p) => pathToPoints(p));

  return optimize(
    nodesToSvg(
      [
        ...getPaths(format(inkscapeOutput)).filter(
          (path) =>
            !pathToPoints(path).some((point) =>
              selectionPoints.some((selectionPoint) =>
                isDistanceSmaller(point, selectionPoint, 3.9),
              ),
            ),
        ),
        ...selected,
      ].map(pathToPathNode),
      height,
      width,
    ),
  );
}

export default memoize(cutOut);
