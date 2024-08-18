"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import SvgPreview from "../SvgPreview";
import { Path, Point } from "../SvgPreview/types";
import getPaths, { getNodes } from "../SvgPreview/utils";
import { stringify, INode } from "svgson";
import throttle from "lodash/throttle";
import round from "lodash/round";
import debounce from "lodash/debounce";
import format from "./format";

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
  attributes: { d: path.d.replace(/-?\d+(\.\d+)?/g, (n) => round(+n, 5) + "") },
});

const getDistance = (a: Point, b: Point) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

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

const SvgEditor = ({
  src,
  onChange,
  selected,
  onSelectionChange,
}: {
  src: string;
  onChange: (svg: string) => unknown;
  selected: Selection[];
  onSelectionChange: (
    fn: ((selection: Selection[]) => Selection[]) | Selection[],
  ) => unknown;
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

    let isMenuOpen = false;
    const onMenuUpdate = debounce(() => {
      isMenuOpen = !!document.body.querySelector("[role='menu']");
    });

    const onMouseDown = (event: MouseEvent | TouchEvent) => {
      //@ts-ignore
      const className = event.target?.getAttribute("class");
      //@ts-ignore
      if (event.target?.getAttribute("role") === "menuitem") {
        return;
      }
      if (
        className?.startsWith("svg-editor-") ||
        className?.startsWith("svg-preview-bounding-box-label")
      ) {
        event.preventDefault();

        // @ts-ignore
        const clientX = event.clientX ?? event.touches[0].clientX;
        // @ts-ignore
        const clientY = event.clientY ?? event.touches[0].clientY;

        // @ts-ignore
        if (event.touches?.length > 1) return;

        // @ts-ignore
        const dataIds = event.target?.getAttribute("data-ids")?.split(" ") as
          | string[]
          | undefined;

        const id = parseInt(
          dataIds?.[0]?.split("-")[0] || className.split("-").at(-2),
        );
        const idx = parseInt(
          dataIds?.[0]?.split("-")[1] || className.split("-").at(-1),
        );

        const paths = getPaths(src);
        const path = paths.find((p) => p.c.id === id && p.c.idx === idx);

        if (path) {
          dragTargetRef.current = {
            ...path,
            startPosition: { x: clientX, y: clientY },
            type: dataIds?.length ? "svg-editor-path" : className.split(" ")[0],
          };
          if (dataIds?.length) {
            onSelectionChange(
              dataIds
                ?.map((id) => id.split("-"))
                .map(([id, idx]) => ({
                  ...(paths.find(
                    (p) => p.c.id === parseInt(id) && p.c.idx === parseInt(idx),
                  ) as Path),
                  startPosition: { x: clientX, y: clientY },
                  type: "svg-editor-path",
                })) || [],
            );
          } else {
            onSelectionChange((selection) => {
              if (event.shiftKey && !selection.length) {
                return paths
                  .filter((p) => p.c.id === id)
                  .map((p) => ({
                    ...p,
                    startPosition: { x: clientX, y: clientY },
                    type: className.split(" ")[0],
                  }));
              }
              const alreadySelected = selection.some(
                (s) => s.c.id === id && s.c.idx === idx,
              );
              if (event.shiftKey && alreadySelected) {
                return selection.filter(
                  (s) => s.c.id !== id || s.c.idx !== idx,
                );
              }
              if (event.shiftKey || alreadySelected) {
                return [...selection, dragTargetRef.current!];
              }
              return [dragTargetRef.current!];
            });
          }
        } else {
          onSelectionChange([]);
          dragTargetRef.current = undefined;
        }

        return;
      }
      if (
        // @ts-ignore
        !event.target.closest(
          "button, a, input, textarea, select, details, [role='menuitem'], [role='menu']",
        ) &&
        !isMenuOpen
      ) {
        onSelectionChange([]);
      }
    };

    const editorWidth =
      document.getElementById("svg-editor")?.clientWidth ?? 350;
    const editorHeight =
      document.getElementById("svg-editor")?.clientHeight ?? 350;

    const onMouseMove = throttle((event: MouseEvent | TouchEvent) => {
      if (dragTargetRef.current) {
        // @ts-ignore
        const clientX = event.clientX ?? event.touches[0].clientX;
        // @ts-ignore
        const clientY = event.clientY ?? event.touches[0].clientY;

        // @ts-ignore
        if (event.touches?.length > 1) return;

        event.preventDefault();

        const movedDelta = {
          x:
            ((clientX - dragTargetRef.current.startPosition.x) * 24) /
            editorWidth,
          y:
            ((clientY - dragTargetRef.current.startPosition.y) * 24) /
            editorHeight,
        };

        const getSnapDelta = (
          currentPathIndex: number,
          snapTargetKey: "prev" | "next" | "circle" | "cp1" | "cp2",
        ) => {
          const snapPath = scopedPaths[currentPathIndex];
          const snapTarget = snapPath[snapTargetKey];
          if (!snapTarget) return { x: 0, y: 0 };
          const movedAbsolute = {
            x: snapTarget.x + movedDelta.x,
            y: snapTarget.y + movedDelta.y,
          };

          // check if there is a point nearby
          for (let i = 0; i < scopedPaths.length; i++) {
            const scopedPath = scopedPaths[i];
            if (
              (i !== currentPathIndex || snapTargetKey !== "prev") &&
              getDistance(movedAbsolute, scopedPath.prev) < 0.75
            ) {
              return {
                x: scopedPath.prev.x - snapTarget.x,
                y: scopedPath.prev.y - snapTarget.y,
              };
            }
            if (
              (i !== currentPathIndex || snapTargetKey !== "next") &&
              getDistance(movedAbsolute, scopedPath.next) < 0.75
            ) {
              return {
                x: scopedPath.next.x - snapTarget.x,
                y: scopedPath.next.y - snapTarget.y,
              };
            }
            if (
              scopedPath.circle &&
              (i !== currentPathIndex || snapTargetKey !== "circle") &&
              getDistance(movedAbsolute, scopedPath.circle) < 0.75
            ) {
              return {
                x: scopedPath.circle.x - snapTarget.x,
                y: scopedPath.circle.y - snapTarget.y,
              };
            }
          }

          // snap to points where the circle is intersecting the grid
          if (snapPath.circle) {
            const theta = Math.atan2(
              movedAbsolute.y - snapPath.circle.y,
              movedAbsolute.x - snapPath.circle.x,
            );

            let deltaTheta = 0;
            while (deltaTheta < Math.PI) {
              let plusPoint: Point = {
                x:
                  snapPath.circle.x +
                  snapPath.circle.r * Math.cos(theta + deltaTheta),
                y:
                  snapPath.circle.y +
                  snapPath.circle.r * Math.sin(theta + deltaTheta),
              };

              let minusPoint: Point = {
                x:
                  snapPath.circle.x +
                  snapPath.circle.r * Math.cos(theta - deltaTheta),
                y:
                  snapPath.circle.y +
                  snapPath.circle.r * Math.sin(theta - deltaTheta),
              };

              if (
                getDistance(movedAbsolute, plusPoint) < 0.75 &&
                plusPoint.x % 0.5 < 0.01 &&
                plusPoint.y % 0.5 < 0.01
              ) {
                return {
                  x: Math.round(plusPoint.x * 2) / 2 - snapTarget.x,
                  y: Math.round(plusPoint.y * 2) / 2 - snapTarget.y,
                };
              }
              if (
                getDistance(movedAbsolute, minusPoint) < 0.75 &&
                minusPoint.x % 0.5 < 0.01 &&
                minusPoint.y % 0.5 < 0.01
              ) {
                return {
                  x: Math.round(minusPoint.x * 2) / 2 - snapTarget.x,
                  y: Math.round(minusPoint.y * 2) / 2 - snapTarget.y,
                };
              }

              deltaTheta += 0.001;
            }

            deltaTheta = 0;
            while (deltaTheta < Math.PI) {
              let plusPoint: Point = {
                x:
                  snapPath.circle.x +
                  snapPath.circle.r * Math.cos(theta + deltaTheta),
                y:
                  snapPath.circle.y +
                  snapPath.circle.r * Math.sin(theta + deltaTheta),
              };

              let minusPoint: Point = {
                x:
                  snapPath.circle.x +
                  snapPath.circle.r * Math.cos(theta - deltaTheta),
                y:
                  snapPath.circle.y +
                  snapPath.circle.r * Math.sin(theta - deltaTheta),
              };

              if (getDistance(movedAbsolute, plusPoint) < 1.5) {
                if (plusPoint.x % 0.5 < 0.01) {
                  return {
                    x: Math.round(plusPoint.x * 2) / 2 - snapTarget.x,
                    y: plusPoint.y - snapTarget.y,
                  };
                }
                if (plusPoint.y % 0.5 < 0.01) {
                  return {
                    x: plusPoint.x - snapTarget.x,
                    y: Math.round(plusPoint.y * 2) / 2 - snapTarget.y,
                  };
                }
              }
              if (getDistance(movedAbsolute, minusPoint) < 1.5) {
                if (minusPoint.x % 0.5 < 0.01) {
                  return {
                    x: Math.round(minusPoint.x * 2) / 2 - snapTarget.x,
                    y: minusPoint.y - snapTarget.y,
                  };
                }
                if (minusPoint.y % 0.5 < 0.01) {
                  return {
                    x: minusPoint.x - snapTarget.x,
                    y: Math.round(minusPoint.y * 2) / 2 - snapTarget.y,
                  };
                }
              }

              deltaTheta += 0.001;
            }
          }

          // snap to grid
          return {
            x: Math.round(movedAbsolute.x * 2) / 2 - snapTarget.x,
            y: Math.round(movedAbsolute.y * 2) / 2 - snapTarget.y,
          };
        };

        const targetI = scopedPaths.findIndex(
          (p) =>
            p.c.id === dragTargetRef.current?.c?.id &&
            p.c.idx === dragTargetRef.current?.c?.idx,
        );

        if (targetI === -1) return;

        const snapDelta = getSnapDelta(
          targetI,
          (
            {
              "svg-editor-path": "prev",
              "svg-editor-start": "prev",
              "svg-editor-end": "next",
              "svg-editor-circle": "circle",
              "svg-editor-cp1": "cp1",
              "svg-editor-cp2": "cp2",
            } as const
          )[dragTargetRef.current.type],
        );

        for (const {
          c: { id, idx },
        } of selected) {
          const i = scopedPaths.findIndex(
            (p) => p.c.id === id && p.c.idx === idx,
          );

          const movedPath = movedPaths[i];
          const scopedPath = scopedPaths[i];

          switch (dragTargetRef.current.type) {
            case "svg-editor-path": {
              movedPath.prev.x = scopedPath.prev.x + snapDelta.x;
              movedPath.prev.y = scopedPath.prev.y + snapDelta.y;
              movedPath.next.x = scopedPath.next.x + snapDelta.x;
              movedPath.next.y = scopedPath.next.y + snapDelta.y;
              if (movedPath.circle && scopedPath.circle) {
                movedPath.circle.x = scopedPath.circle.x + snapDelta.x;
                movedPath.circle.y = scopedPath.circle.y + snapDelta.y;
              }
              if (movedPath.cp1 && scopedPath.cp1) {
                movedPath.cp1.x = scopedPath.cp1.x + snapDelta.x;
                movedPath.cp1.y = scopedPath.cp1.y + snapDelta.y;
              }
              if (movedPath.cp2 && scopedPath.cp2) {
                movedPath.cp2.x = scopedPath.cp2.x + snapDelta.x;
                movedPath.cp2.y = scopedPath.cp2.y + snapDelta.y;
              }
              break;
            }
            case "svg-editor-circle": {
              if (i !== targetI) break;
              movedPath.prev.x = scopedPath.prev.x + snapDelta.x;
              movedPath.prev.y = scopedPath.prev.y + snapDelta.y;
              movedPath.next.x = scopedPath.next.x + snapDelta.x;
              movedPath.next.y = scopedPath.next.y + snapDelta.y;
              movedPath.circle!.x = scopedPath.circle!.x + snapDelta.x;
              movedPath.circle!.y = scopedPath.circle!.y + snapDelta.y;
              break;
            }
            case "svg-editor-cp1": {
              if (i !== targetI) break;
              movedPath.cp1!.x = scopedPath.cp1!.x + snapDelta.x;
              movedPath.cp1!.y = scopedPath.cp1!.y + snapDelta.y;
              break;
            }
            case "svg-editor-cp2": {
              if (i !== targetI) break;
              movedPath.cp2!.x = scopedPath.cp2!.x + snapDelta.x;
              movedPath.cp2!.y = scopedPath.cp2!.y + snapDelta.y;
              break;
            }
            case "svg-editor-start": {
              if (i !== targetI) break;
              movedPath.prev.x = scopedPath.prev.x + snapDelta.x;
              movedPath.prev.y = scopedPath.prev.y + snapDelta.y;
              if (movedPath.cp1 && scopedPath.cp1) {
                movedPath.cp1.x = scopedPath.cp1.x + snapDelta.x;
                movedPath.cp1.y = scopedPath.cp1.y + snapDelta.y;
              }
              break;
            }
            case "svg-editor-end": {
              if (i !== targetI) break;
              movedPath.next.x = scopedPath.next.x + snapDelta.x;
              movedPath.next.y = scopedPath.next.y + snapDelta.y;
              if (movedPath.cp2 && scopedPath.cp2) {
                movedPath.cp2.x = scopedPath.cp2.x + snapDelta.x;
                movedPath.cp2.y = scopedPath.cp2.y + snapDelta.y;
              }
              break;
            }
          }

          const n = scopedPaths[i].d.split(" ");
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
    }, 1000 / 60);

    const onMouseUp = () => {
      const movedPathsString = JSON.stringify(movedPaths);
      if (scopedPathsString !== movedPathsString) {
        scopedPaths = movedPaths;
        scopedPathsString = movedPathsString;
        movedPaths = JSON.parse(movedPathsString);
        const nodes = getNodes(src);
        const nextNodes = nodes.flatMap((val, id) =>
          // @ts-ignore
          id === dragTargetRef.current?.c.id ||
          selected.some(({ c }) => c.id === id)
            ? movedPaths.filter(({ c }) => c.id === id).map(pathToPathNode)
            : [val],
        );
        const nextPaths = getPaths(format(nodesToSvg(nextNodes as any)));
        onChange(nodesToSvg(nextNodes as any));
        onSelectionChange(
          selected
            .map((selected) => {
              const d = movedPaths.find(
                (p) => p.c.id === selected.c.id && p.c.idx === selected.c.idx,
              )?.d;
              if (!d) return undefined;
              const nextPath = nextPaths.find((nextPath) => nextPath.d === d);
              if (!nextPath) return undefined;
              return { ...selected, ...nextPath };
            })
            .filter(Boolean) as Selection[],
        );
      }
      dragTargetRef.current = undefined;
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    document.addEventListener("touchstart", onMouseDown, { passive: false });
    document.addEventListener("touchmove", onMouseMove);
    document.addEventListener("touchend", onMouseUp);

    document.addEventListener("dismissableLayer.update", onMenuUpdate);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      document.removeEventListener("dismissableLayer.update", onMenuUpdate);

      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, [src, selected, onChange, onSelectionChange]);

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
        <mask id="svg-editor-opacity-mask" maskUnits="userSpaceOnUse">
          <rect x={0} y={0} width={24} height={24} stroke="none" fill="black" />
          {selected.map(({ c: { id, idx } }, i) => (
            <React.Fragment key={i}>
              <path
                d={paths.find((p) => p.c.id === id && p.c.idx === idx)?.d ?? ""}
                stroke="white"
                strokeWidth={2.25}
              />
            </React.Fragment>
          ))}
          {selected.map(({ c: { id, idx } }, i) => (
            <React.Fragment key={i}>
              <path
                d={paths.find((p) => p.c.id === id && p.c.idx === idx)?.d ?? ""}
                stroke="black"
              />
            </React.Fragment>
          ))}
        </mask>
        <rect
          x={0}
          y={0}
          width={24}
          height={24}
          className="fill-black dark:fill-white pointer-events-none"
          stroke="none"
          mask="url(#svg-editor-opacity-mask)"
        />
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
