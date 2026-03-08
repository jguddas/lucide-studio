import { svgPathBbox } from "svg-path-bbox";
import memoize from "lodash/memoize";

export const getPathBounds = memoize((d: string) => {
    const [x1, y1, x2, y2] = svgPathBbox(d);
    return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
    };
})