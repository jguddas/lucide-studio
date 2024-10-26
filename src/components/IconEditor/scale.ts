import Commander from "svg-path-commander";
// @ts-ignore
import toPath from "element-to-path";
import { parseSync, stringify } from "svgson";
import optimize from "./optimize";

const scale = (svg: string, targetWidth: number, targetHeight: number) => {
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
      origin: [0, 0],
      scale: [targetWidth / width, targetHeight / height],
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
  data.attributes.height = targetHeight + "";
  data.attributes.width = targetWidth + "";
  data.attributes.viewBox = `0 0 ${targetWidth} ${targetHeight}`;
  return optimize(stringify(data));
};

export default scale;
