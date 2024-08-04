import svgson from "svgson";

export type LucideIconNode =
  | readonly [string, Record<string, string>]
  | readonly [string, Record<string, string>, LucideIconNode[]];

export function mapNode(node: svgson.INode): LucideIconNode {
  return (node.children?.length ?? 0 > 0)
    ? [node.name, node.attributes, node.children?.map(mapNode)]
    : [node.name, node.attributes];
}
