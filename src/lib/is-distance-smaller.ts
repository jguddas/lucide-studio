import { Point } from "@/lib/get-paths";

export const isDistanceSmaller = (
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  threshold: number,
) => {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2 <= threshold * threshold;
};