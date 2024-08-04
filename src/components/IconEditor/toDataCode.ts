import svgson from "svgson";
import { camelCase, upperFirst } from "lodash";
import { mapNode } from "./mapNode";

export const toDataCode = async (
  svg: string,
  name?: string | null,
): Promise<string> => {
  const parsed = await svgson.parse(svg);
  return `
export const ${upperFirst(camelCase(name ?? "foobar"))}Icon = ${JSON.stringify(parsed.children.map(mapNode), undefined, 2)};
`;
};
