"use client";
import Editor from "react-simple-code-editor";
import SvgEditor, { Selection } from "./SvgEditor";
import highlight from "./highlight";
import optimize from "./optimize";
import React, { useState } from "react";
import format from "./format";
import { Label } from "@/components/ui/label";
import { WandSparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import getPaths from "@/components/SvgPreview/utils";
import { useQueryState } from "next-usequerystate";
import debounce from "lodash/debounce";

interface IconEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const IconEditor = ({ value, onChange }: IconEditorProps) => {
  const [, setName] = useQueryState("name");
  const [, setBase] = useQueryState("base");
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useState<Selection[]>([]);
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
        <SvgEditor
          src={nextValue || value}
          selected={selected}
          onChange={(value) => onChange(format(value))}
          onSelectionChange={setSelected}
        />
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
                setBase(e.clipboardData.files[0].name?.split(".")[0]);
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === "string") {
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
                /class="lucide lucide-([\w-]+)"/,
              );
              if (clipboardDataName && clipboardDataName[1]) {
                setName(clipboardDataName[1]);
              }
              onChange(format(clipboardData));
              setSelected([]);
            }
          }}
          onValueChange={onChange}
          className="h-full min-w-full min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground data-[focus=true]:outline-none data-[focus=true]:ring-2 data-[focus=true]:ring-ring data-[focus=true]:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-focus={focus}
          padding={12}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          highlight={(value) => highlight(value).join("")}
        />
        <div className="absolute flex flex-col z-10 gap-1.5 top-[calc(0.875rem+0.375rem+12px)] right-[12px]">
          <Button
            variant="outline"
            className="gap-1.5"
            onMouseEnter={() => setNextValue(optimize(value))}
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
  }`,
    )
    .join("")}
        `}
      </style>
    </div>
  );
};

export default IconEditor;
