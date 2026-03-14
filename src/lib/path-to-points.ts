import memoize from "lodash/memoize";
import SVGPathCommander from "svg-path-commander";
import { Path } from "@/lib/get-paths";

function _pathToPoints({ d, prev, next }: Path, interval = 1) {
  const commander = new SVGPathCommander(d);
  const points = [];
  try {
    const totalLength = commander.getTotalLength();
    points.push(prev);
    for (let i = interval; i < totalLength - interval; i += interval) {
      points.push(commander.getPointAtLength(i));
    }
    points.push(next);
  } catch (err) {}
  return points;
}

export const pathToPoints = memoize(
  _pathToPoints,
  (path, interval) => `${path.d}-${interval}`,
);
