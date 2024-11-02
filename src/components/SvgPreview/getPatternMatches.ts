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

    for (let i = 0; i < paths.length * 2; i++) {
      if (!pattern.vectors.has(vectors[Math.floor(i / 2)])) continue;
      const points = getPoints(
        paths,
        paths[Math.floor(i / 2)][i % 2 ? "prev" : "next"],
      );
      const pointSet = new Set(points);
      if (!pattern.points.isSubsetOf(pointSet)) continue;
      const matchedPaths: Path[] = [];
      for (
        let j = 0;
        j < paths.length && matchedPaths.length < pattern.size;
        j++
      ) {
        if (!pattern.vectors.has(vectors[j])) continue;
        if (!pattern.points.has(points[j])) continue;
        matchedPaths.push(paths[j]);
      }
      if (matchedPaths.length !== pattern.size) continue;
      output.push({ patternName, paths: matchedPaths });
    }
  }
  return output.filter(
    (val, idx, arr) =>
      arr.findIndex(
        (t) =>
          t.patternName === val.patternName &&
          t.paths.every(
            ({ c: { id, idx } }, i) =>
              id === val.paths[i].c.id && idx === val.paths[i].c.idx,
          ),
      ) === idx,
  );
};

export const getVectors = (paths: Path[]) =>
  paths.map(
    ({ next, prev, c }) =>
      (c.type === 8 || c.type === 4 || c.type === 1 ? 16 : c.type) +
      "|" +
      Math.round(Math.abs(next.x - prev.x) * 100) / 100 +
      "|" +
      Math.round(Math.abs(next.y - prev.y) * 100) / 100,
  );

export const getPoints = (
  paths: Path[],
  offset: { x: number; y: number } = { x: 0, y: 0 },
) =>
  paths.map(
    ({ prev, next }) =>
      Math.round(((prev.x + next.x) / 2 - offset.x) * 100) / 100 +
      "|" +
      Math.round(((prev.y + next.y) / 2 - offset.y) * 100) / 100,
  );
