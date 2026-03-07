import { svgPathBbox } from "svg-path-bbox";
import memoize from "lodash/memoize";

export const mSVGPathBBox = memoize(svgPathBbox)