import svgson from "svgson";

export type LucideIconNode =
  | readonly [string, Record<string, string>]
  | readonly [string, Record<string, string>, LucideIconNode[]];

const hash = (string: string, seed = 5381) => {
  let i = string.length;

  while (i) {
    // eslint-disable-next-line no-bitwise, no-plusplus
    seed = (seed * 33) ^ string.charCodeAt(--i);
  }

  // eslint-disable-next-line no-bitwise
  return (seed >>> 0).toString(36).substr(0, 6);
};

const generateHashedKey = ({
  name,
  attributes,
}: {
  name: string;
  attributes: Record<string, string>;
}) => hash(JSON.stringify([name, attributes]));

export function mapNode(node: svgson.INode): LucideIconNode {
  node.attributes.key = generateHashedKey(node);
  return (node.children?.length ?? 0 > 0)
    ? [node.name, node.attributes, node.children?.map(mapNode)]
    : [node.name, node.attributes];
}
