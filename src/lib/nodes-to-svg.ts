import { INode, stringify } from "svgson";

export const nodesToSvg = (
  nodes: INode[],
  height: number,
  width: number,
) => `<svg
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
${nodes.map((node) => "  " + stringify(node)).join("\n")}
</svg>`;