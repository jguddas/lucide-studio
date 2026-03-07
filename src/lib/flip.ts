import Commander from "svg-path-commander";
// @ts-ignore
import { parseSync, stringify } from "svgson";
import { optimize } from "@/lib/optimize";
import memoize from "lodash/memoize";
import { getPaths } from "./get-paths";

const _flip = (svg: string, orientation: "horizontal" | "vertical") => {
  const data = parseSync(svg);
  const paths = getPaths(svg);
  const height = data.attributes.height ? parseInt(data.attributes.height) : 24;
  const width = data.attributes.width ? parseInt(data.attributes.width) : 24;
  data.children = [];
  for (let i = 0; i < paths.length; i++) {
    const commands = new Commander(paths[i].d);
    commands.transform({
      origin: [height / 2, width / 2],
      rotate: orientation === "horizontal" ? [0, 180, 0] : [180, 0, 0],
    });
    data.children.push({
      name: "path",
      type: "element",
      children: [],
      value: "",
      attributes: {
        d: commands.toString(),
      },
    });
  }
  return optimize(stringify(data));
};

export const flip = memoize(
  _flip,
  (svg: string, orientation: "horizontal" | "vertical") =>
    `${svg}-${orientation}`,
);

