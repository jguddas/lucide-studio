"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import SvgPreview from "../SvgPreview";
import { Path, Point } from "../SvgPreview/types";
import getPaths, { getNodes } from "../SvgPreview/utils";
import { stringify, INode } from "svgson";
import throttle from "lodash/throttle";
import { round } from "lodash";

const nodesToSvg = (nodes: INode[]) => `<svg
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
${nodes.map((node) => "  " + stringify(node)).join("\n")}
</svg>`;

const pathToPathNode = (path: Path) => ({
  name: "path",
  type: "element",
  value: undefined,
  children: [],
  attributes: { d: path.d },
});

export type Selection = {
  startPosition: { x: number; y: number };
  type:
    | "svg-editor-path"
    | "svg-editor-start"
    | "svg-editor-end"
    | "svg-editor-circle"
    | "svg-editor-cp1"
    | "svg-editor-cp2";
} & Path;

const limit = (val: number) => Math.max(0, Math.min(val, 24));

const SvgEditor = ({
  src,
  onChange,
  onSelectionChange,
}: {
  src: string;
  onChange: (svg: string) => unknown;
  onSelectionChange: (selection: Selection | undefined) => unknown;
}) => {
  const [paths, setPaths] = useState<Path[]>(() => getPaths(src));
  const dragTargetRef = useRef<Selection | undefined>(undefined);

  useEffect(() => {
    let scopedPaths: Path[];
    try {
      scopedPaths = getPaths(src);
    } catch (e) {
      scopedPaths = [];
    }
    let scopedPathsString = JSON.stringify(scopedPaths);
    let movedPaths = JSON.parse(scopedPathsString) as typeof scopedPaths;
    try {
      setPaths(scopedPaths);
    } catch (e) {
      console.error(e);
    }

    const onMouseDown = (event: MouseEvent) => {
      //@ts-ignore
      const className = event.target?.getAttribute("class");
      //@ts-ignore
      if (event.target?.getAttribute("role") === "menuitem") {
        return;
      }
      if (className?.startsWith("svg-editor-")) {
        event.preventDefault();

        const id = parseInt(className.split("-").at(-2));
        const idx = parseInt(className.split("-").at(-1));

        const path = getPaths(src).find(
          (p) => p.c.id === id && p.c.idx === idx,
        );

        dragTargetRef.current = path
          ? {
              ...path,
              startPosition: { x: event.clientX, y: event.clientY },
              type: className.split(" ")[0],
            }
          : undefined;
        onSelectionChange(dragTargetRef.current);
        return;
      }
      // @ts-ignore
      if (event.target?.closest("svg")?.id === "svg-editor") {
        onSelectionChange(undefined);
      }
    };

    const onMouseMove = throttle((event: MouseEvent) => {
      if (dragTargetRef.current) {
        event.preventDefault();
        const x =
          ((event.clientX - dragTargetRef.current.startPosition.x) * 24) / 350;
        const y =
          ((event.clientY - dragTargetRef.current.startPosition.y) * 24) / 350;
        for (let i = 0; i < scopedPaths.length; i++) {
          const movedPath = movedPaths[i];
          const scopedPath = scopedPaths[i];
          if (
            scopedPath.c.id === dragTargetRef.current.c.id &&
            scopedPath.c.idx === dragTargetRef.current.c.idx
          ) {
            const n = scopedPaths[i].d.split(" ");

            let snapSource: Point | undefined = undefined;
            switch (dragTargetRef.current.type) {
              case "svg-editor-path":
              case "svg-editor-circle":
                snapSource = movedPath.circle ?? movedPath.prev;
                break;
              case "svg-editor-cp1":
                snapSource = movedPath.cp1;
                break;
              case "svg-editor-cp2":
                snapSource = movedPath.cp2;
                break;
              case "svg-editor-start":
                snapSource = movedPath.prev;
                break;
              case "svg-editor-end":
                snapSource = movedPath.next;
                break;
            }

            const snapXDelta = snapSource
              ? Math.round((snapSource.x + x) * 2) / 2 - snapSource.x - x
              : 0;
            const snapYDelta = snapSource
              ? Math.round((snapSource.y + y) * 2) / 2 - snapSource.y - y
              : 0;

            switch (dragTargetRef.current.type) {
              case "svg-editor-path":
                movedPath.prev.x = limit(scopedPath.prev.x + snapXDelta + x);
                movedPath.prev.y = limit(scopedPath.prev.y + snapYDelta + y);
                movedPath.next.x = limit(scopedPath.next.x + snapXDelta + x);
                movedPath.next.y = limit(scopedPath.next.y + snapYDelta + y);
                if (movedPath.circle && scopedPath.circle) {
                  movedPath.circle.x = scopedPath.circle.x + snapXDelta + x;
                  movedPath.circle.y = scopedPath.circle.y + snapYDelta + y;
                }
                if (movedPath.cp1 && scopedPath.cp1) {
                  movedPath.cp1.x = limit(scopedPath.cp1.x + snapXDelta + x);
                  movedPath.cp1.y = limit(scopedPath.cp1.y + snapYDelta + y);
                }
                if (movedPath.cp2 && scopedPath.cp2) {
                  movedPath.cp2.x = limit(scopedPath.cp2.x + snapXDelta + x);
                  movedPath.cp2.y = limit(scopedPath.cp2.y + snapYDelta + y);
                }
                break;
              case "svg-editor-circle":
                movedPath.prev.x = limit(scopedPath.prev.x + snapXDelta + x);
                movedPath.prev.y = limit(scopedPath.prev.y + snapYDelta + y);
                movedPath.next.x = limit(scopedPath.next.x + snapXDelta + x);
                movedPath.next.y = limit(scopedPath.next.y + snapYDelta + y);
                if (movedPath.circle && scopedPath.circle) {
                  movedPath.circle.x = scopedPath.circle.x + snapXDelta + x;
                  movedPath.circle.y = scopedPath.circle.y + snapYDelta + y;
                }
                break;
              case "svg-editor-cp1":
                if (movedPath.cp1 && scopedPath.cp1) {
                  movedPath.cp1.x = limit(scopedPath.cp1.x + snapXDelta + x);
                  movedPath.cp1.y = limit(scopedPath.cp1.y + snapYDelta + y);
                }
                break;
              case "svg-editor-cp2":
                if (movedPath.cp2 && scopedPath.cp2) {
                  movedPath.cp2.x = limit(scopedPath.cp2.x + snapXDelta + x);
                  movedPath.cp2.y = limit(scopedPath.cp2.y + snapYDelta + y);
                }
                break;
              case "svg-editor-start":
                movedPath.prev.x = limit(scopedPath.prev.x + snapXDelta + x);
                movedPath.prev.y = limit(scopedPath.prev.y + snapYDelta + y);
                break;
              case "svg-editor-end":
                movedPath.next.x = limit(scopedPath.next.x + snapXDelta + x);
                movedPath.next.y = limit(scopedPath.next.y + snapYDelta + y);
                break;
            }
            if (movedPath.cp1) {
              n[3] = "C" + round(movedPath.cp1.x, 3);
              n[4] = round(movedPath.cp1.y, 3) + "";
            }
            if (movedPath.cp2) {
              n[5] = round(movedPath.cp2.x, 3) + "";
              n[6] = round(movedPath.cp2.y, 3) + "";
            }
            n[1] = round(movedPath.prev.x, 3) + "";
            n[2] = round(movedPath.prev.y, 3) + "";
            n[n.length - 2] = round(movedPath.next.x, 3) + "";
            n[n.length - 1] = round(movedPath.next.y, 3) + "";
            if (movedPath.d !== n.join(" ")) {
              movedPath.d = n.join(" ");
              movedPaths[i] = movedPath;
              setPaths(movedPaths.slice(0));
            }
          }
        }
      }
    }, 1000 / 60);

    const onMouseUp = () => {
      const movedPathsString = JSON.stringify(movedPaths);
      if (scopedPathsString !== movedPathsString) {
        scopedPaths = movedPaths;
        scopedPathsString = movedPathsString;
        movedPaths = JSON.parse(movedPathsString);
        const nodes = getNodes(src);
        onChange(
          nodesToSvg(
            nodes.flatMap((val, id) =>
              // @ts-ignore
              id === dragTargetRef.current?.c.id
                ? movedPaths.filter(({ c }) => c.id === id).map(pathToPathNode)
                : [val],
            ),
          ),
        );
      }
      dragTargetRef.current = undefined;
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [src, onChange, onSelectionChange]);

  return (
    <>
      <SvgPreview
        showGrid
        id="svg-editor"
        src={paths}
        className="h-full w-full"
      >
        <filter id="shadow" color-interpolation-filters="sRGB">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5" />
        </filter>
        <g strokeWidth={1.5} strokeOpacity={0}>
          {paths.map(({ d, c, next, prev, circle, cp1, cp2 }, i) => (
            <React.Fragment key={i}>
              <path
                className={`svg-editor-path svg-editor-segment-${c.id}-${c.idx}`}
                d={d}
              />
              <path
                className={`svg-editor-start svg-editor-segment-${c.id}-${c.idx}`}
                d={`M${prev.x} ${prev.y}h.01`}
              />
              <path
                className={`svg-editor-end svg-editor-segment-${c.id}-${c.idx}`}
                strokeWidth={1.5}
                d={`M${next.x} ${next.y}h.01`}
              />
              {circle && (
                <path
                  className={`svg-editor-circle svg-editor-segment-${c.id}-${c.idx}`}
                  strokeWidth={1.5}
                  d={`M${circle.x} ${circle.y}h.01`}
                />
              )}
              {cp1 && (
                <path
                  className={`svg-editor-cp1 svg-editor-segment-${c.id}-${c.idx}`}
                  strokeWidth={1.5}
                  d={`M${cp1.x} ${cp1.y}h.01`}
                />
              )}
              {cp2 && (
                <path
                  className={`svg-editor-cp2 svg-editor-segment-${c.id}-${c.idx}`}
                  strokeWidth={1.5}
                  d={`M${cp2.x} ${cp2.y}h.01`}
                />
              )}
            </React.Fragment>
          ))}
        </g>
      </SvgPreview>
    </>
  );
};

export default SvgEditor;
