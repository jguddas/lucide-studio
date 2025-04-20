"use client";
import Editor from "react-simple-code-editor";
import SvgEditor, { nodesToSvg, pathToPathNode } from "./SvgEditor";
import highlight from "./highlight";
import optimize from "./optimize";
import React, { useState } from "react";
import format from "./format";
import { Label } from "@/components/ui/label";
import {
  CopyIcon,
  ScissorsIcon,
  SquareTerminalIcon,
  Trash2Icon,
  TypeOutlineIcon,
  WandSparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import getPaths, { getNodes } from "@/components/SvgPreview/utils";
import { useQueryState } from "next-usequerystate";
import debounce from "lodash/debounce";
import { useSelection, Selection } from "../SelectionProvider";
import round from "lodash/round";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { cutWithInkscape } from "./cut-with-inkscape";

interface IconEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const IconEditor = ({ value, onChange }: IconEditorProps) => {
  const [, setName] = useQueryState("name");
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useSelection();
  const [nextValue, setNextValue] = useState<string | undefined>(undefined);

  const onSelect = debounce((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd } = e.target;

    const highlights = highlight(value);

    const paths = getPaths(value);
    const newSelection: Selection[] = [];
    for (let i = selectionEnd || 0; i >= 0; i--) {
      if (i < selectionStart - 1 && highlights[i].includes("</span>")) {
        break;
      }
      if (highlights[i].includes("icon-editor-highlight")) {
        const matchPath = highlights[i].match(
          /icon-editor-highlight-segment-(\d+)-(\d+)/,
        );

        const path =
          matchPath?.[1] &&
          matchPath?.[2] &&
          paths.find(
            (p) =>
              p.c.id + "" === matchPath[1] && p.c.idx + "" === matchPath[2],
          );

        if (path) {
          newSelection.push({
            ...path,
            startPosition: { x: 0, y: 0 },
            type: "svg-editor-path",
          });
          continue;
        }

        const matchElement = highlights[i].match(/icon-editor-highlight-(\d+)/);

        const element =
          !!matchElement?.[1] &&
          paths.filter((p) => p.c.id + "" === matchElement[1]);

        if (element && element.length) {
          for (const path of element) {
            newSelection.push({
              ...path,
              startPosition: { x: 0, y: 0 },
              type: "svg-editor-path",
            });
          }
        }
      }
    }
    setSelected(newSelection);
  });

  return (
    <div className="flex gap-5 flex-col lg:flex-row">
      <div className="flex flex-col gap-1.5 h-[min-content] w-full lg:w-[480px]">
        <Label asChild>
          <span>Preview</span>
        </Label>
        <ContextMenu>
          <ContextMenuTrigger>
            <SvgEditor
              src={nextValue || value}
              onChange={(value) => {
                setNextValue(undefined);
                onChange(format(value));
              }}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              className="gap-1.5"
              disabled={!selected.length}
              onClick={() => {
                const height = parseInt(
                  value.match(/height="(\d+)"/)?.[1] ?? "24",
                );
                const width = parseInt(
                  value.match(/width="(\d+)"/)?.[1] ?? "24",
                );
                const paths = getPaths(value);
                const nextNodes = getNodes(value).flatMap((node, id) => {
                  if (!selected.some(({ c }) => c.id === id)) {
                    return node;
                  }
                  return paths
                    .filter(
                      (path) =>
                        path.c.id === id &&
                        !selected.some(
                          ({ c }) => c.id === path.c.id && c.idx === path.c.idx,
                        ),
                    )
                    .map(pathToPathNode);
                });
                onChange(format(nodesToSvg(nextNodes, height, width)));
                setSelected([]);
              }}
            >
              <Trash2Icon />
              Delete
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-1.5"
              disabled={!selected.length}
              onClick={() => {
                const height = parseInt(
                  value.match(/height="(\d+)"/)?.[1] ?? "24",
                );
                const width = parseInt(
                  value.match(/width="(\d+)"/)?.[1] ?? "24",
                );
                const nextNodes = [
                  ...getNodes(value),
                  ...selected
                    .flatMap((path) => {
                      const n = path.d.split(" ");
                      if (path.cp1) {
                        n[3] = "C" + round(path.cp1.x + 3, 3);
                        n[4] = round(path.cp1.y + 1, 3) + "";
                      }
                      if (path.cp2) {
                        n[5] = round(path.cp2.x + 3, 3) + "";
                        n[6] = round(path.cp2.y + 1, 3) + "";
                      }
                      n[1] = round(path.prev.x + 3, 3) + "";
                      n[2] = round(path.prev.y + 1, 3) + "";
                      n[n.length - 2] = round(path.next.x + 3, 3) + "";
                      n[n.length - 1] = round(path.next.y + 1, 3) + "";
                      return [
                        path,
                        {
                          ...path,
                          d: n.join(" "),
                        },
                      ];
                    })
                    .map(pathToPathNode),
                ];
                onChange(format(nodesToSvg(nextNodes, height, width)));
              }}
            >
              <CopyIcon />
              Duplicate
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-1.5"
              disabled={!selected.length}
              onClick={() => {
                const selectionAsPath = getPaths(value)
                  .filter(({ c }) =>
                    selected.some((s) => s.c.id === c.id && s.c.idx === c.idx),
                  )
                  .map(({ d }) => d)
                  .join(" ");
                window.navigator.clipboard.writeText(
                  cutWithInkscape(value, selectionAsPath),
                );
                toast(
                  <span className="flex gap-1.5 items-center">
                    <SquareTerminalIcon />
                    Bash script copied to clipboard.
                  </span>,
                );
              }}
            >
              <TypeOutlineIcon />
              Cutout with Inkscape
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-1.5"
              disabled={!selected.length}
              onClick={() => {
                const selectionAsPath = getPaths(value)
                  .filter(({ c }) =>
                    selected.some((s) => s.c.id === c.id && s.c.idx === c.idx),
                  )
                  .map(({ d }) => d)
                  .join(" ");
                window.navigator.clipboard.writeText(
                  cutWithInkscape(value, selectionAsPath, {
                    strokeWidth: 0.01,
                  }),
                );
                toast(
                  <span className="flex gap-1.5 items-center">
                    <SquareTerminalIcon />
                    Bash script copied to clipboard.
                  </span>,
                );
              }}
            >
              <ScissorsIcon />
              Cut with Inkscape
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <span className="text-xs text-muted-foreground hidden lg:inline-block">
          Tip:{" "}
          {selected.length
            ? "Shift-click to add or remove segments from the selection."
            : "Shift-click to select the full element."}
        </span>
      </div>
      <div className="relative flex flex-col gap-1.5 w-full">
        <Label htmlFor="source-editor">Source</Label>
        <Editor
          textareaId="source-editor"
          value={nextValue || value}
          onSelect={(_e) => onSelect(_e as any)}
          onClick={(_e) => onSelect(_e as any)}
          onPaste={(e) => {
            if (e.clipboardData.files.length > 0) {
              e.preventDefault();
              if (e.clipboardData.files[0].name) {
                setName(e.clipboardData.files[0].name?.split(".")[0]);
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === "string") {
                  setNextValue(undefined);
                  onChange(format(result));
                  setSelected([]);
                }
              };
              reader.readAsText(e.clipboardData.files[0]);
            }
            if (
              // @ts-ignore
              e.target.selectionStart === 0 &&
              // @ts-ignore
              e.target.selectionEnd === e.target.value.length
            ) {
              e.preventDefault();
              const clipboardData = e.clipboardData.getData("text/plain");
              const clipboardDataName = clipboardData.match(
                /class="lucide lucide-([\w-]+)/,
              );
              if (clipboardDataName && clipboardDataName[1]) {
                setName(clipboardDataName[1].replace(/-icon$/, ""));
              }
              setNextValue(undefined);
              onChange(format(clipboardData));
              setSelected([]);
            }
          }}
          onValueChange={setNextValue}
          className="h-full min-w-full min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground data-[focus=true]:outline-none data-[focus=true]:ring-2 data-[focus=true]:ring-ring data-[focus=true]:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-focus={focus}
          padding={12}
          onFocus={() => {
            setFocus(true);
            setNextValue(undefined);
            onChange(format(nextValue || value));
          }}
          onBlur={() => {
            setFocus(false);
            setNextValue(undefined);
            onChange(format(nextValue || value));
          }}
          highlight={(value) => highlight(value).join("")}
        />
        <div className="absolute flex flex-col z-10 gap-1.5 top-[calc(0.875rem+0.375rem+12px)] right-[12px]">
          <Button
            variant="outline"
            className="gap-1.5"
            onMouseEnter={() => {
              const nextNextValue = optimize(nextValue || value);
              onChange(format(nextValue || value));
              setNextValue(nextNextValue);
            }}
            onMouseLeave={() => setNextValue(undefined)}
            onClick={() => onChange(optimize(value))}
          >
            <WandSparklesIcon />
            Tidy
          </Button>
        </div>
      </div>
      <style>
        {`
  textarea.npm__react-simple-code-editor__textarea:focus { outline: none }
  .svg-preview-bounding-box-label-path:hover { cursor: pointer; user-select: none }
  .svg-preview-bounding-box-label-path:active { cursor: grabbing }
  .svg-editor-path:hover, .svg-editor-start:hover, .svg-editor-end:hover, .svg-editor-circle:hover, .svg-editor-cp1:hover, .svg-editor-cp2:hover { stroke: black; stroke-opacity: 0.5 }
  .svg-editor-path, .svg-editor-start, .svg-editor-end, .svg-editor-circle, .svg-editor-cp1, .svg-editor-cp2 { cursor: pointer }
  ${selected
    .map(
      ({ c: { id, idx } }) => `
  .icon-editor-highlight-${id},
  .icon-editor-highlight-segment-${id}-${idx} {
    box-shadow: 0 0 0 2px black !important;
  }
  .icon-editor-highlight-${id}:is(.dark *),
  .icon-editor-highlight-segment-${id}-${idx}:is(.dark *) {
    box-shadow: 0 0 0 2px white !important;
  }
  `,
    )
    .join("")}
        `}
      </style>
    </div>
  );
};

export default IconEditor;
