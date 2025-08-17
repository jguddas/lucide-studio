import memoize from "lodash/memoize";
import getPaths from "../SvgPreview/utils";
import format from "./format";
import { Path } from "../SvgPreview/types";
import { nodesToSvg, pathToPathNode } from "./SvgEditor";

const emptyState = format("");

async function cut(svg: string, selected: Path[]) {
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
              selected.every((s) => !(s.c.id === c.id && s.c.idx === c.idx)),
            )
            .map(({ d }) => d)
            .join(" ")}" />
          ${selected
            .map(
              ({ d }) =>
                `<path d="${d}" class="mask" stroke-width="0.01" stroke-linecap="round" stroke-linejoin="round"/>`,
            )
            .join("\n")}
        </svg>
      `,
  }).then((r) => r.text());

  if (format(inkscapeOutput) === emptyState) {
    throw new Error(inkscapeOutput);
  }

  return format(
    nodesToSvg(
      [...getPaths(format(inkscapeOutput)), ...selected].map(pathToPathNode),
      height,
      width,
    ),
  );
}

export default memoize(
  cut,
  (svg, selected) => `${svg}:${selected.map((s) => `${s.d}`).join("")}`,
);
