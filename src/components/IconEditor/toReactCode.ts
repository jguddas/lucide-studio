import svgson from "svgson";
import { camelCase, upperFirst } from "lodash";
import { mapNode } from "./mapNode";

export const toReactCode = async (
  svg: string,
  name?: string | null,
): Promise<string> => {
  const parsed = await svgson.parse(svg);
  return `
import { createLucideIcon } from "lucide-react";
export const ${upperFirst(camelCase(name ?? "foobar"))}Icon = createLucideIcon("${name ?? "foobar"}", ${JSON.stringify(parsed.children.map(mapNode), undefined, 2)});
`;
};
