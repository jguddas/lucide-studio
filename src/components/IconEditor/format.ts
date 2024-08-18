import { INode, parseSync, stringify } from "svgson";
import commander from "svg-path-commander";
import memoize from "lodash/memoize";

type Options = {
  filterNodes?: boolean;
  sortNodes?: boolean;
  filterAttributes?: boolean;
  sortAttributes?: boolean;
};

const getChildren = (node: INode, options?: Options): INode[] => {
  if (node.children && Array.isArray(node.children) && node.children.length) {
    return node.children.flatMap((value) => getChildren(value, options));
  }
  if (
    [
      "rect",
      "circle",
      "ellipse",
      "polygon",
      "polyline",
      "line",
      "path",
    ].includes(node.name)
  ) {
    const order = {
      rect: ["x", "y", "width", "height", "rx", "ry"],
      circle: ["cx", "cy", "r", "fill"],
      ellipse: ["cx", "cy", "rx", "ry"],
      polygon: ["points"],
      polyline: ["points"],
      line: ["x1", "y1", "x2", "y2"],
      path: ["d"],
    }[node.name];

    if (!order) return [];

    const filtered =
      options?.filterAttributes === false
        ? Object.entries(node.attributes)
        : Object.entries(node.attributes).filter(([key]) =>
            order.includes(key),
          );

    const sorted =
      options?.sortAttributes === false
        ? filtered
        : filtered.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));

    node.attributes = Object.fromEntries(sorted);

    if (node.name === "path") {
      const pattern = /m([^m]*)/gi;
      if ((node.attributes.d.match(pattern)?.length || 0) > 1) {
        return (
          new commander(node.attributes.d)
            .toAbsolute()
            .toString()
            .match(pattern)
            ?.map((val) => ({
              name: "path",
              type: "element",
              value: "",
              children: [],
              attributes: { ...node.attributes, d: val },
            })) || []
        );
      }
    }
    return [node];
  }
  return [];
};

const format = (svg: string, options?: Options) => {
  const data = parseSync(svg.includes("<svg") ? svg : `<svg>${svg}</svg>`);
  const children = getChildren(data, options).map(
    (c) => "  " + stringify(c).replace(/\/>$/, " />"),
  );

  const sorted =
    options?.sortNodes === false
      ? children
      : children.sort((a, b) => {
          const isPathA = a.includes("<path");
          const isPathB = b.includes("<path");
          if (isPathA && !isPathB) return -1;
          if (!isPathA && isPathB) return 1;
          return a.localeCompare(b);
        });

  const filtered =
    options?.filterNodes === false
      ? sorted
      : sorted.filter(
          (val, idx, arr) => arr.findIndex((v) => v === val) === idx,
        );

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
${filtered.join("\n")}
</svg>`;
};

export default memoize(format);
