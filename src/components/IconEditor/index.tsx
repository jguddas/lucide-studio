"use client";
import Editor from "react-simple-code-editor";
import SvgEditor, { Selection } from "./SvgEditor";
import highlight from "./highlight";
import optimize from "./optimize";
import React, { useState } from "react";
import format from "./format";
import { Label } from "@/components/ui/label";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IconEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const IconEditor = ({ value, onChange }: IconEditorProps) => {
  const [focus, setFocus] = useState(false);
  const [selected, setSelected] = useState<Selection | undefined>(undefined);
  const [nextValue, setNextValue] = useState<string | undefined>(undefined);
  return (
    <div className="flex gap-5 flex-col lg:flex-row">
      <div className="flex flex-col gap-1.5 h-[min-content] w-[25vw] max-w-[840px] min-w-[480px]">
        <Label htmlFor="interactive-editor">Preview</Label>
        <SvgEditor
          src={nextValue || value}
          onChange={(v) => onChange(format(v))}
          onSelectionChange={setSelected}
        />
      </div>
      <div className="relative flex flex-col gap-1.5 w-full">
        <Label htmlFor="source-editor">Source</Label>
        <Editor
          id="source-editor"
          value={nextValue || value}
          onClick={(e) => {
            const highlights = highlight(value);
            // @ts-ignore
            if (e.target?.selectionStart !== e.target?.selectionEnd) return;
            // @ts-ignore
            for (let i = e.target?.selectionStart || 0; i >= 0; i--) {
              if (
                // @ts-ignore
                i < e.target?.selectionStart - 1 &&
                highlights[i].includes("</span>")
              ) {
                setSelected(undefined);
                break;
              }
              if (highlights[i].includes("icon-editor-highlight")) {
                const match = highlights[i].match(
                  /icon-editor-highlight-segment-(\d+)-(\d+)/,
                );
                setSelected(
                  match
                    ? {
                        id: parseInt(match[1]),
                        idx: parseInt(match[2]),
                        startPosition: { x: 0, y: 0 },
                        type: "svg-editor-path",
                      }
                    : undefined,
                );
                break;
              }
            }
          }}
          onPaste={(e) => {
            if (e.clipboardData.files.length > 0) {
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === "string") {
                  onChange(format(result));
                  setSelected(undefined);
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
              onChange(format(e.clipboardData.getData("text/plain")));
              setSelected(undefined);
            }
          }}
          onValueChange={onChange}
          className="h-full min-w-[480px] min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground data-[focus=true]:outline-none data-[focus=true]:ring-2 data-[focus=true]:ring-ring data-[focus=true]:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <SparklesIcon />
            Tidy
          </Button>
        </div>
      </div>
      <style>
        {`
  textarea.npm__react-simple-code-editor__textarea:focus { outline: none }
  .svg-editor-path:hover, .svg-editor-start:hover, .svg-editor-end:hover, .svg-editor-cp1:hover, .svg-editor-cp2:hover { stroke: black; stroke-opacity: 0.5 }
  .svg-editor-path, .svg-editor-start, .svg-editor-end, .svg-editor-cp1, .svg-editor-cp2 { cursor: pointer }
  .svg-editor-segment-${selected?.id}-${selected?.idx}.svg-editor-path { stroke: black; stroke-opacity: 0.5 }
  .svg-editor-segment-${selected?.id}-${selected?.idx}:active { cursor: grabbing !important }
  .icon-editor-highlight-segment-${selected?.id}-${selected?.idx} {
    box-shadow: 0 0 0 2px black !important;
  }
        `}
      </style>
    </div>
  );
};

export default IconEditor;
