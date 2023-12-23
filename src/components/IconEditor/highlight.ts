import memoize from "lodash/memoize";
import { parse } from "parse5";

const length = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 };
function parsePathData(path: string) {
  const data = [];
  const pattern = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
  const numbers = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;

  let segment;
  while ((segment = pattern.exec(path))) {
    const args = [];
    let arg;
    let i = 0;
    while ((arg = numbers.exec(segment[2])) || i++ > 100) {
      // @ts-ignore
      args.push({ value: arg[0], index: arg.index });
    }

    let command = segment[1];
    let type = command.toLowerCase();
    let offset = 0;

    // overloaded moveTo
    if (type == "m" && args.length > 2) {
      const endIndex =
        segment.index +
        args[length[type] - 1].index +
        args[length[type] - 1].value.length +
        1;
      data.push({
        command,
        type,
        args: args.splice(0, 2),
        loc: [segment.index, endIndex],
      });
      offset = args[0].index + 1;
      type = "l";
      command = command == "m" ? "l" : "L";
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const endIndex =
        type == "z"
          ? segment.index + 1
          : segment.index +
            1 +
            // @ts-ignore
            args[length[type] - 1].index +
            // @ts-ignore
            args[length[type] - 1].value.length;
      // @ts-ignore
      if (args.length == length[type]) {
        data.push({
          command,
          type,
          args,
          loc: [segment.index + offset, endIndex],
        });
        break;
      } else {
        data.push({
          command,
          type,
          // @ts-ignore
          args: args.splice(0, length[type]),
          loc: [segment.index + offset, endIndex],
        });
        offset = args[0].index + 1;
      }
    }
  }

  return data;
}

const extractPaths = (
  node: any,
): {
  d?: string;
  name:
    | "rect"
    | "circle"
    | "ellipse"
    | "polygon"
    | "polyline"
    | "line"
    | "path";
  sourceCodeLocation: any;
}[] => {
  if (node.nodeName === "path") {
    return [
      {
        // @ts-ignore
        d: node.attrs.find(({ name }) => name === "d").value,
        name: node.nodeName,
        sourceCodeLocation: node.sourceCodeLocation,
      },
    ];
  } else if (
    /(rect|circle|ellipse|polygon|polyline|line)/.test(node.nodeName)
  ) {
    return [
      {
        name: node.nodeName,
        sourceCodeLocation: node.sourceCodeLocation,
      },
    ];
  } else if (node.childNodes && Array.isArray(node.childNodes)) {
    return node.childNodes.flatMap(extractPaths);
  }

  return [];
};
const getCommands = (src: string) => {
  const svgNode = (
    (
      parse(src.includes("<svg") ? src : `<svg>${src}</src>`, {
        sourceCodeLocationInfo: true,
      }) as any
    ).childNodes[0].parentNode.childNodes[0].parentNode.childNodes[0] as any
  ).childNodes[1].childNodes[0];
  const globalOffset = src.includes("<svg") ? 0 : -1;
  // @ts-ignore
  return extractPaths(svgNode).flatMap((node, idx) => {
    if (node.name !== "path") {
      return {
        name: node.name,
        id: idx,
        loc: [
          node.sourceCodeLocation.startOffset + globalOffset,
          node.sourceCodeLocation.endOffset + globalOffset,
        ],
      };
    }

    // @ts-ignore
    const pathData = parsePathData(node.d);
    let rawDataAttribute = src.slice(
      node.sourceCodeLocation.attrs.d.startOffset,
      node.sourceCodeLocation.attrs.d.endOffset,
    );
    // @ts-ignore
    const initialOffset = rawDataAttribute.indexOf(node.d);
    rawDataAttribute = rawDataAttribute.slice(initialOffset);

    const offset =
      node.sourceCodeLocation.attrs.d.startOffset +
      initialOffset +
      globalOffset;
    for (let i = 0; i < pathData.length; i++) {
      const c = pathData[i];
      // @ts-ignore
      pathData[i].id = idx;
      // @ts-ignore
      pathData[i].idx = i;
      // @ts-ignore
      pathData[i].name = node.name;
      pathData[i].loc = [offset + c.loc[0], offset + c.loc[1]];
    }
    return pathData;
  });
};

const escape = (src: string) =>
  src
    .replace(new RegExp("&", "g"), "&amp")
    .replace(new RegExp("<", "g"), "&lt");

const highlight = (src: string) => {
  const highlight = (
    src: Record<number, string>,
    start: number,
    end: number,
    color: string,
    selector: string,
  ) => {
    if (!src[start] || !src[end]) return src;
    src[start] =
      `<span class="icon-editor-highlight-${selector}" style="position: relative;box-shadow: 0 0 0 1px white;color: #fff; background-color: ${color}; border-radius: 2px">` +
      src[start];
    src[end - 1] = src[end - 1] + "</span>";
    return src;
  };

  const escaped = Object.fromEntries(
    Object.entries(src).map(([key, val]) => [key, escape(val)]),
  );

  const colors = [
    "#1982c4",
    "#4267AC",
    "#6a4c93",
    "#B55379",
    "#FF595E",
    "#FF7655",
    "#ff924c",
    "#FFAE43",
    "#ffca3a",
    "#C5CA30",
    "#8ac926",
    "#52A675",
  ];

  let highlighted = escaped;
  const styles: string[] = [];
  try {
    const commands = getCommands(src);

    let idx = 0;
    for (let i = 0; i < commands.length; i++) {
      // @ts-ignore
      const { loc, type, name, idx: cIdx, id: cId } = commands[i];
      if (type !== "m") {
        const color = colors[(name === "path" ? idx++ : cId) % colors.length];
        const selector = name === "path" ? `segment-${cId}-${cIdx}` : `${cId}`;
        styles.push(`.svg-preview-colored-${selector} { stroke: ${color} }`);
        // @ts-ignore
        if (commands[i - 1]?.type === "m") {
          highlighted = highlight(
            highlighted,
            // @ts-ignore
            commands[i - 1].loc[0],
            loc[1],
            color,
            selector,
          );
        } else {
          highlighted = highlight(highlighted, loc[0], loc[1], color, selector);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  return Object.values(highlighted).concat(
    `<style>${styles.join("\n")}</style>`,
  );
};

export default memoize(highlight);
