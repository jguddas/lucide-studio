import getPaths from "../SvgPreview/utils";

const defaultActions = [
  "select-by-id:mask",
  "copy",
  "path-break-apart",
  "paste-style",
  "object-stroke-to-path",
  "path-combine",
  "select-all",
  "path-cut",
];

export const cutWithInkscape = (
  svg: string,
  mask: string,
  { actions = defaultActions, extras = mask, strokeWidth = 8 } = {},
) =>
  `
#!/usr/bin/env bash

export PATH="$PATH:/Applications/Inkscape.app/Contents/MacOS"
if ! command -v inkscape &> /dev/null; then
    echo "inkscape could not be found"
    exit 1
fi

TEMP_DIR=$(mktemp -d)

echo '
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="${getPaths(svg)
    .map(({ d }) => d)
    .join("")}" />
  <path d="${mask}" id="mask" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
' > "$TEMP_DIR"/original.svg

inkscape --batch-process --with-gui --actions="${actions.join(";")};export-filename:$TEMP_DIR/modified.svg;export-do;FileClose" "$TEMP_DIR"/original.svg

CUT_PATH=$(grep ' d=".*"' "$TEMP_DIR"/modified.svg | grep -oe 'M[^"]*')
url=$(echo "${window.location.origin}/edit?value=%3Cpath+d=%22${extras}$CUT_PATH%22+/%3E" | tr '\n' ' ' | tr ' ' '+')

if command -v open &> /dev/null; then
  open "$url"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$url"
else
  echo "$url"
fi
`.trim();
