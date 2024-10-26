import Commander from "svg-path-commander";
// @ts-ignore
import toPath from "element-to-path";
import { parseSync, stringify } from "svgson";
import { BBox, svgPathBbox } from "svg-path-bbox";

const crop = (svg: string, _bbox?: BBox) => {
  const data = parseSync(svg);
  const bbox =
    _bbox ??
    svgPathBbox(
      data.children
        .map((child) => child.attributes.d ?? toPath(child))
        .join(" "),
    );
  for (let i = 0; i < data.children.length; i++) {
    const d =
      data.children[i].name === "path"
        ? data.children[i].attributes.d
        : toPath(data.children[i]);
    const commands = new Commander(d);
    commands.transform({
      origin: [0, 0],
      translate: [-bbox[0] + 2, -bbox[1] + 2],
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
  const height = Math.ceil(Math.floor((bbox[3] - bbox[1] + 4) * 10) / 10);
  const width = Math.ceil(Math.floor((bbox[2] - bbox[0] + 4) * 10) / 10);
  data.attributes.height = height + "";
  data.attributes.width = width + "";
  data.attributes.viewBox = `0 0 ${width} ${height}`;
  return stringify(data);
};

export default crop;
