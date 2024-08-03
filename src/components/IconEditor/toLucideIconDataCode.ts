import svgson from "svgson";
import { camelCase, upperFirst } from "lodash";

export type LucideIconNode = readonly [string, Record<string, string>]
  | readonly [string, Record<string, string>, LucideIconNode[]];

export const toLucideIconDataCode = async (svg: string, name?: string | null): Promise<string> => {
  function mapNode(node: svgson.INode): LucideIconNode {
    return node.children?.length ?? 0 > 0
      ? [node.name, node.attributes, node.children?.map(mapNode)]
      : [node.name, node.attributes];
  }

  const parsed = await svgson.parse(svg);
  return `
export const ${upperFirst(camelCase(name ?? 'foobar'))}Icon = ${JSON.stringify(parsed.children.map(mapNode), undefined, 2)};
`;
}
