import SVGPathCommander from "svg-path-commander";
import fs from "fs";
import optimize from "./src/components/IconEditor/optimize";

const toRelative = (line: string) => {
  const d = line.replace(/  <path d="/, "").replace(/" \/>/, "");
  const path = new SVGPathCommander(d, { round: 3 });

  const [_, x, y] = path.segments[0];
  path.reverse();
  if (
    x < path.segments[0][1] ||
    (x === path.segments[0][1] && y < path.segments[0][2])
  ) {
    path.reverse();
  }

  return path
    .toRelative()
    .toString()
    .split(/(m[^a-z]*)/gi)
    .slice(1);
};

const oldSvg = fs.readFileSync(process.argv[2], "utf8");
const newSvg = fs.readFileSync(process.argv[3], "utf8");

const newSvgLines = newSvg.split("\n");
const oldSvgLines = oldSvg.split("\n");
const onlyInNewSvgPaths = newSvgLines
  .filter((line) => !oldSvgLines.includes(line))
  .filter((line) => line.startsWith("  <path d="))
  .map(toRelative);

const onlyInOldSvgPaths = oldSvgLines
  .filter((line) => !newSvgLines.includes(line))
  .filter((line) => line.startsWith("  <path d="))
  .map(toRelative);

const diff = Object.fromEntries(
  onlyInOldSvgPaths
    .map((line, idx) => [
      line[1],
      `m${
        parseFloat(onlyInNewSvgPaths[idx][0].split(/m/i)[1].split(" ")[0]) -
        parseFloat(line[0].split(/m/i)[1].split(" ")[0])
      } ${
        parseFloat(onlyInNewSvgPaths[idx][0].split(" ")[1]) -
        parseFloat(line[0].split(" ")[1])
      } ` + onlyInNewSvgPaths[idx][1],
    ])
    .filter(([_, b]) => b),
);

for (const file of process.argv.slice(4)) {
  const input = fs.readFileSync(file, "utf8");
  const output = input
    .split("\n")
    .map((line) => {
      if (!line.startsWith("  <path d=")) return line;
      const [start, normalizedSegments] = toRelative(line);
      if (!diff[normalizedSegments]) return line;
      return (
        '  <path d="' +
        new SVGPathCommander(start + diff[normalizedSegments], { round: 3 })
          .toAbsolute()
          .toString()
          .replace(/^M[^M]*/, "") +
        '" />'
      );
    })
    .join("\n");

  if (input !== output) {
    console.log("Writing", file);
    fs.writeFileSync(file, optimize(output));
  }
}
