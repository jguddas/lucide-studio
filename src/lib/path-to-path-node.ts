import { round } from "lodash";
import { Path } from "@/lib/get-paths";

export const pathToPathNode = (path: Path) => ({
  name: "path",
  type: "element",
  value: "",
  children: [],
  attributes: {
    d: path.d.replace(/-?\d+(\.\d+)?/g, (n) => round(+n, 5) + ""),
  },
});