import format from "./format";

export const trim = (svg: string) => {
  const height = parseInt(svg.match(/height="(\d+)"/)?.[1] ?? "24");
  const width = parseInt(svg.match(/width="(\d+)"/)?.[1] ?? "24");
  return format(svg)
    .replaceAll(/[\r\n]+/g, " ")
    .replace(
      /\<svg[^\>]*>/g,
      height === 24 && width === 24
        ? ""
        : `<svg width="${width}" height="${height}">`,
    )
    .replace(/\<\/svg[^\>]*>/g, height === 24 && width === 24 ? "" : "</svg>")
    .replaceAll(/> *</g, "><")
    .trim();
};
