import { Path } from "./types";
import patternData from "./patterns.json";

const patterns = new Map(
  Object.entries(patternData).map(([patternName, pattern]) => [
    patternName,
    {
      vectors: new Set(pattern.vectors),
      points: new Set(pattern.points),
      size: pattern.vectors.length,
    },
  ]),
);

export const getPatternMatches = (paths: Path[]) => {
  const vectors = getVectors(paths);
  const vectorSet = new Set(vectors);

  const output: { patternName: string; paths: Path[] }[] = [];
  for (const [patternName, pattern] of patterns) {
    if (!pattern.vectors.isSubsetOf(vectorSet)) continue;

    for (let i = 0; i < paths.length; i++) {
      if (!pattern.vectors.has(vectors[i])) continue;
      const points = getPoints(paths, paths[i].prev);
      const pointSet = new Set(points);
      if (!pattern.points.isSubsetOf(pointSet)) continue;
      const matchedPaths: Path[] = [];
      for (
        let j = 0;
        j < paths.length && matchedPaths.length < pattern.size;
        j++
      ) {
        if (!pattern.vectors.has(vectors[j])) continue;
        if (
          !pattern.points.has(points[j * 2]) &&
          !pattern.points.has(points[j * 2 + 1])
        )
          continue;
        matchedPaths.push(paths[j]);
      }
      if (matchedPaths.length !== pattern.size) continue;
      output.push({ patternName, paths: matchedPaths });
    }
  }
  return output;
};

const getVectors = (paths: Path[]) =>
  paths.map(({ next, prev, c }) =>
    [
      c.type === 8 || c.type === 4 || c.type === 1 ? 16 : c.type,
      Math.round(Math.abs(next.x - prev.x) * 1000) / 1000,
      Math.round(Math.abs(next.y - prev.y) * 1000) / 1000,
    ].join("|"),
  );

const getPoints = (
  paths: Path[],
  offset: { x: number; y: number } = { x: 0, y: 0 },
) =>
  paths.flatMap(({ prev, next }) => [
    Math.round((prev.x - offset.x) * 1000) / 1000 +
      "|" +
      Math.round((prev.y - offset.y) * 1000) / 1000,
    Math.round((next.x - offset.x) * 1000) / 1000 +
      "|" +
      Math.round((next.y - offset.y) * 1000) / 1000,
  ]);
