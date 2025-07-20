import Commander from "svg-path-commander";
// @ts-ignore
import toPath from "element-to-path";
import { parseSync, stringify } from "svgson";
import optimize from "./optimize";

const flip = (svg: string, orientation: "horizontal" | "vertical") => {
  const data = parseSync(svg);
  const height = data.attributes.height ? parseInt(data.attributes.height) : 24;
  const width = data.attributes.width ? parseInt(data.attributes.width) : 24;
  for (let i = 0; i < data.children.length; i++) {
    const d =
      data.children[i].name === "path"
        ? data.children[i].attributes.d
        : toPath(data.children[i]);
    const commands = new Commander(d);
    commands.transform({
      origin: [height / 2, width / 2],
      rotate: orientation === "horizontal" ? [0, 180, 0] : [180, 0, 0],
    });
    data.children[i] = {
      name: "path",
      type: "element",
      children: [],
      value: "",
      attributes: {
        d: commands.toString(),
      },
    };
  }
  return optimize(stringify(data));
};

export default flip;
