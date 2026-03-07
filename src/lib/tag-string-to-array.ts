export const tagStringToArray = (tagString: string | undefined): string[] =>
  (tagString || "")
    .split("\n")
    .map((val) => val.trim())
    .filter((val, idx, arr) => val && arr.indexOf(val) === idx);
