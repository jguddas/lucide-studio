import React from "react";
import { PathProps, Path, Point } from "./types";
import getPaths, { assert } from "./utils";
import { BBox, svgPathBbox } from "svg-path-bbox";
import memoize from "lodash/memoize";
import { getPatternMatches } from "./getPatternMatches";
import { GapViolationHighlight } from "./GapViolationHighlight";
import { isDistanceSmaller } from "../IconEditor/optimize";

const Grid = ({
  radius,
  fill,
  height,
  width,
  subGridSize = 0,
  ...props
}: {
  height: number;
  width: number;
  strokeWidth: number;
  subGridSize?: number;
  radius: number;
} & PathProps<"stroke", "strokeWidth">) => (
  <g className="svg-preview-grid-group" strokeLinecap="butt" {...props}>
    <rect
      className="svg-preview-grid-rect"
      width={width - props.strokeWidth}
      height={height - props.strokeWidth}
      x={props.strokeWidth / 2}
      y={props.strokeWidth / 2}
      rx={radius}
      fill={fill}
    />
    <path
      strokeDasharray={
        "0 0.1 " +
        "0.1 0.15 ".repeat(subGridSize ? subGridSize * 4 - 1 : 95) +
        "0 0.15"
      }
      strokeWidth={0.1}
      d={
        props.d ||
        [
          ...new Array(Math.floor(width - 1))
            .fill(null)
            .map((_, i) => i)
            .filter((i) => !subGridSize || i % subGridSize !== subGridSize - 1)
            .flatMap((i) => [
              `M${i + 1} ${props.strokeWidth}v${height - props.strokeWidth * 2}`,
            ]),
          ...new Array(Math.floor(height - 1))
            .fill(null)
            .map((_, i) => i)
            .filter((i) => !subGridSize || i % subGridSize !== subGridSize - 1)
            .flatMap((i) => [
              `M${props.strokeWidth} ${i + 1}h${width - props.strokeWidth * 2}`,
            ]),
        ].join("")
      }
    />
    {!!subGridSize && (
      <path
        d={
          props.d ||
          [
            ...new Array(Math.floor(width - 1))
              .fill(null)
              .map((_, i) => i)
              .filter((i) => i % subGridSize === subGridSize - 1)
              .flatMap((i) => [
                `M${i + 1} ${props.strokeWidth}v${height - props.strokeWidth * 2}`,
              ]),
            ...new Array(Math.floor(height - 1))
              .fill(null)
              .map((_, i) => i)
              .filter((i) => i % subGridSize === subGridSize - 1)
              .flatMap((i) => [
                `M${props.strokeWidth} ${i + 1}h${width - props.strokeWidth * 2}`,
              ]),
          ].join("")
        }
      />
    )}
  </g>
);

const Shadow = ({
  radius,
  paths,
  ...props
}: {
  radius: number;
  paths: Path[];
} & PathProps<"stroke" | "strokeWidth" | "strokeOpacity", "d">) => {
  const groupedPaths = Object.entries(
    paths.reduce(
      (groups, val) => {
        const key = val.c.id;
        groups[key] = [...(groups[key] || []), val];
        return groups;
      },
      {} as Record<number, Path[]>,
    ),
  );
  return (
    <>
      <g className="svg-preview-shadow-mask-group" {...props}>
        {groupedPaths.map(([id, paths]) => (
          <mask
            key={`svg-preview-shadow-mask-${id}`}
            id={`svg-preview-shadow-mask-${id}`}
            maskUnits="userSpaceOnUse"
            strokeOpacity="1"
            strokeWidth={props.strokeWidth}
            stroke="#000"
          >
            <rect
              x={0}
              y={0}
              width="100%"
              height="100%"
              fill="#fff"
              stroke="none"
              rx={radius}
            />
            <path
              d={paths
                .flatMap(({ prev, next }) => [
                  `M${prev.x} ${prev.y}h.01`,
                  `M${next.x} ${next.y}h.01`,
                ])
                .filter((val, idx, arr) => arr.indexOf(val) === idx)
                .join("")}
            />
          </mask>
        ))}
      </g>
      <g className="svg-preview-shadow-group" {...props}>
        {paths.map(({ d, c: { id } }, i) => (
          <path key={i} mask={`url(#svg-preview-shadow-mask-${id})`} d={d} />
        ))}
        <path
          d={paths
            .flatMap(({ prev, next }) => [
              `M${prev.x} ${prev.y}h.01`,
              `M${next.x} ${next.y}h.01`,
            ])
            .filter((val, idx, arr) => arr.indexOf(val) === idx)
            .join("")}
        />
      </g>
    </>
  );
};

const ColoredPath = ({
  colors,
  paths,
  ...props
}: { paths: Path[]; colors: string[] } & PathProps<never, "d" | "stroke">) => {
  let idx = 0;
  return (
    <g className="svg-preview-colored-path-group" {...props}>
      {paths.map(({ d, c }, i) => (
        <path
          key={i}
          d={d}
          stroke={colors[(c.name === "path" ? idx++ : c.id) % colors.length]}
        />
      ))}
    </g>
  );
};

const ControlPath = ({
  paths,
  radius,
  pointSize,
  ...props
}: {
  pointSize: number;
  paths: Path[];
  radius: number;
} & PathProps<"stroke" | "strokeWidth", "d">) => {
  const controlPaths = paths.map((path, i) => {
    const element = paths.filter((p) => p.c.id === path.c.id);
    const lastElement = element.at(-1)?.next;
    assert(lastElement);
    const isClosed =
      element[0].prev.x === lastElement.x &&
      element[0].prev.y === lastElement.y;
    const showMarker = !["rect", "circle", "ellipse"].includes(path.c.name);
    const dx = path.next.x - path.prev.x;
    const dy = path.next.y - path.prev.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    angle = angle % 90;
    angle =
      (Math.round((angle % 45) * 100) / 100) % 1
        ? Math.round(angle * 100) / 100
        : Math.round(angle * 1000) / 1000;
    return {
      ...path,
      angle,
      showMarker,
      startMarker: showMarker && path.isStart && !isClosed,
      endMarker: showMarker && paths[i + 1]?.isStart !== false && !isClosed,
    };
  });
  return (
    <>
      <g className="svg-preview-control-path-mask-group" stroke="#000">
        {controlPaths.map(({ prev, next, angle, c, showMarker }, idx) => {
          return (
            <mask
              id={`svg-preview-control-path-mask-${idx}`}
              key={idx}
              maskUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="#fff"
                stroke="none"
                rx={radius}
              />
              {showMarker && (
                <>
                  <path d={`M${prev.x} ${prev.y}h.01`} />
                  <path d={`M${next.x} ${next.y}h.01`} />
                </>
              )}
              {(c.type === 16 ||
                c.type === 8 ||
                c.type === 4 ||
                c.type === 1) &&
              !isDistanceSmaller(prev, next, 3.5) &&
              angle % 45 > 0.001 &&
              angle % 45 < 44.999 ? (
                <text
                  fontSize={0.75}
                  strokeWidth={0.4}
                  dominantBaseline="middle"
                  textAnchor="middle"
                >
                  <textPath
                    startOffset="50%"
                    href={`#svg-preview-control-path-${idx}`}
                  >
                    {angle}°
                  </textPath>
                </text>
              ) : undefined}
            </mask>
          );
        })}
      </g>
      <g className="svg-preview-control-path-group" {...props}>
        {controlPaths.map(({ d, showMarker, prev, next, angle, c }, idx) => (
          <path
            key={idx}
            id={`svg-preview-control-path-${idx}`}
            strokeDasharray={
              (c.type === 16 || c.type === 8 || c.type === 4 || c.type === 1) &&
              angle % 45 > 0.001 &&
              angle % 45 < 44.999
                ? "0.25 0.25"
                : "0"
            }
            mask={
              showMarker
                ? `url(#svg-preview-control-path-mask-${idx})`
                : undefined
            }
            d={
              (c.type === 16 || c.type === 8 || c.type === 4 || c.type === 1) &&
              prev.x > next.x
                ? `M${next.x} ${next.y}L${prev.x} ${prev.y}}`
                : d
            }
          />
        ))}
      </g>
      <g className="svg-preview-control-path-text-group">
        {controlPaths.map(({ angle, prev, next, c }, idx) =>
          (c.type === 16 || c.type === 8 || c.type === 4 || c.type === 1) &&
          !isDistanceSmaller(prev, next, 3.5) &&
          angle % 45 > 0.001 &&
          angle % 45 < 44.999 ? (
            <text
              key={idx}
              stroke={props.stroke}
              fill={props.stroke}
              fontSize={0.75}
              strokeWidth={0.06}
              dominantBaseline="middle"
              textAnchor="middle"
            >
              <textPath
                startOffset="50%"
                href={`#svg-preview-control-path-${idx}`}
              >
                {angle}°
              </textPath>
            </text>
          ) : undefined,
        )}
      </g>
      <g className="svg-preview-control-path-marker-group" {...props}>
        <path
          d={controlPaths
            .flatMap(({ prev, next, showMarker }) =>
              showMarker
                ? [`M${prev.x} ${prev.y}h.01`, `M${next.x} ${next.y}h.01`]
                : [],
            )
            .join("")}
        />
        {controlPaths.map(({ d, prev, next, startMarker, endMarker }, i) => (
          <React.Fragment key={i}>
            {startMarker && (
              <circle cx={prev.x} cy={prev.y} r={pointSize / 2} />
            )}
            {endMarker && <circle cx={next.x} cy={next.y} r={pointSize / 2} />}
          </React.Fragment>
        ))}
      </g>
    </>
  );
};

const Radii = ({
  paths,
  ...props
}: { paths: Path[] } & PathProps<
  "strokeWidth" | "stroke" | "strokeDasharray" | "strokeOpacity",
  any
>) => {
  return (
    <g className="svg-preview-radii-group" {...props}>
      {paths.map(
        ({ circle, next, prev, c }, i) =>
          circle && (
            <React.Fragment key={i}>
              {circle.tangentIntersection && c.name === "path" && (
                <>
                  <circle
                    cx={next.x * 2 - circle.tangentIntersection.x}
                    cy={next.y * 2 - circle.tangentIntersection.y}
                    r={0.25}
                  />
                  <circle
                    cx={prev.x * 2 - circle.tangentIntersection.x}
                    cy={prev.y * 2 - circle.tangentIntersection.y}
                    r={0.25}
                  />
                  <path
                    d={`M${next.x * 2 - circle.tangentIntersection.x} ${
                      next.y * 2 - circle.tangentIntersection.y
                    }L${circle.tangentIntersection.x} ${circle.tangentIntersection.y}L${prev.x * 2 - circle.tangentIntersection.x} ${
                      prev.y * 2 - circle.tangentIntersection.y
                    }`}
                  />
                  <circle
                    cx={circle.tangentIntersection.x}
                    cy={circle.tangentIntersection.y}
                    r={0.25}
                  />
                </>
              )}
              {c.name === "path" && (
                <path
                  d={`M${next.x} ${next.y}L${circle.x} ${circle.y}L${prev.x} ${prev.y}`}
                />
              )}
              <circle
                cy={circle.y}
                cx={circle.x}
                r={0.25}
                strokeDasharray="0"
                stroke={
                  (Math.round(circle.x * 100) / 100) % 1 !== 0 ||
                  (Math.round(circle.y * 100) / 100) % 1 !== 0
                    ? "red"
                    : undefined
                }
              />
              <circle
                cy={circle.y}
                cx={circle.x}
                r={circle.r}
                stroke={
                  (Math.round(circle.r * 1000) / 1000) % 1 !== 0
                    ? "red"
                    : undefined
                }
              />
            </React.Fragment>
          ),
      )}
    </g>
  );
};

const Handles = ({
  paths,
  ...props
}: { paths: Path[] } & PathProps<
  "strokeWidth" | "stroke" | "strokeOpacity",
  any
>) => (
  <g className="svg-preview-handles-group" {...props}>
    {paths.map(({ c, prev, next, cp1, cp2 }, i) => (
      <React.Fragment key={i}>
        {cp1 && <path d={`M${prev.x} ${prev.y} ${cp1.x} ${cp1.y}`} />}
        {cp1 && <circle cy={cp1.y} cx={cp1.x} r={0.25} />}
        {cp2 && <path d={`M${next.x} ${next.y} ${cp2.x} ${cp2.y}`} />}
        {cp2 && <circle cy={cp2.y} cx={cp2.x} r={0.25} />}
      </React.Fragment>
    ))}
  </g>
);

export const mSvgPathBbox = memoize(svgPathBbox);
const mGetPatternMatches = memoize(getPatternMatches);
const PatternMatches = ({
  paths,
  ...props
}: {
  paths: Path[];
} & PathProps<any, any>) => {
  const patternMatches = mGetPatternMatches(paths);
  const patternMatchesWithBounds = patternMatches.map((patternMatch) => {
    const [x1, y1, x2, y2] = mSvgPathBbox(
      patternMatch.paths.map((p) => p.d).join(" "),
    );
    return {
      ...patternMatch,
      bounds: [x1 - 1, y1 - 1, x2 + 1, y2 + 1] satisfies BBox,
    };
  });
  return (
    <>
      <mask id="svg-preview-bounding-box-path-mask" maskUnits="userSpaceOnUse">
        <rect
          stroke="none"
          fill="#fff"
          x={0}
          y={0}
          width="100%"
          height="100%"
        />
        {patternMatchesWithBounds.map(
          ({ patternName, bounds: [x1, y1, x2, y2] }, idx) => (
            <text
              key={idx}
              fontSize={0.75}
              strokeWidth={0.4}
              dominantBaseline="middle"
            >
              <textPath href={`#svg-preview-bounding-box-${idx}`}>
                {patternName} {Math.round(x2 - x1 + 2)}x
                {Math.round(y2 - y1 + 2)}
              </textPath>
            </text>
          ),
        )}
      </mask>
      <mask id="svg-preview-bounding-box-mask" maskUnits="userSpaceOnUse">
        <rect
          stroke="none"
          fill="#fff"
          x={0}
          y={0}
          width="100%"
          height="100%"
        />
        {patternMatchesWithBounds.map(
          ({ patternName, bounds: [x1, y1, x2, y2] }, idx) => (
            <>
              <text fontSize={0.75} strokeWidth={0.4} dominantBaseline="middle">
                <textPath href={`#svg-preview-bounding-box-${idx}`}>
                  {patternName}.{Math.round(x2 - x1 + 2)}.svg
                </textPath>
              </text>
              <path
                strokeWidth={props.strokeWidth}
                mask="url(#svg-preview-bounding-box-mask)"
                id={`svg-preview-bounding-box-${idx}`}
                d={`M${x1} ${y1 - 1}h${x2 - x1 + 0.5}a.5 .5 0 0 1 .5 .5v${y2 - y1 + 1}a.5 .5 0 0 1 -.5 .5h-${x2 - x1 + 1}a.5 .5 0 0 1 -.5 -.5v-${y2 - y1 + 1}a.5 .5 0 0 1 .5 -.5z`}
              />
            </>
          ),
        )}
      </mask>
      <g {...props}>
        <path
          strokeWidth={props.strokeWidth}
          mask="url(#svg-preview-bounding-box-path-mask)"
          d={patternMatchesWithBounds
            .filter(({ patternName }) => patternName.length <= 16)
            .map(
              ({ bounds: [x1, y1, x2, y2] }) =>
                `M${x1} ${y1 - 1}h${x2 - x1 + 0.5}a.5 .5 0 0 1 .5 .5v${y2 - y1 + 1}a.5 .5 0 0 1 -.5 .5h-${x2 - x1 + 1}a.5 .5 0 0 1 -.5 -.5v-${y2 - y1 + 1}a.5 .5 0 0 1 .5 -.5L${x1} ${y1 - 1}`,
            )
            .join(" ")}
        />
        <path
          strokeWidth={props.strokeWidth}
          mask="url(#svg-preview-bounding-box-path-mask)"
          stroke="red"
          d={patternMatchesWithBounds
            .filter(({ patternName }) => patternName.length > 16)
            .map(
              ({ bounds: [x1, y1, x2, y2] }) =>
                `M${x1} ${y1 - 1}h${x2 - x1 + 0.5}a.5 .5 0 0 1 .5 .5v${y2 - y1 + 1}a.5 .5 0 0 1 -.5 .5h-${x2 - x1 + 1}a.5 .5 0 0 1 -.5 -.5v-${y2 - y1 + 1}a.5 .5 0 0 1 .5 -.5L${x1} ${y1 - 1}`,
            )
            .join(" ")}
        />
        {patternMatchesWithBounds.map(
          ({ patternName, paths, bounds: [x1, y1, x2, y2] }, idx) => (
            <text
              key={idx}
              fill={patternName.length > 16 ? "red" : props.stroke}
              fontSize={0.75}
              strokeWidth={0.06}
              stroke={patternName.length > 16 ? "red" : undefined}
              dominantBaseline="middle"
              fillOpacity={props.strokeOpacity}
            >
              <textPath
                href={`#svg-preview-bounding-box-${idx}`}
                className="svg-preview-bounding-box-label-path"
                data-ids={paths.map((p) => `${p.c.id}-${p.c.idx}`).join(" ")}
              >
                {patternName} {Math.round(x2 - x1 + 2)}x
                {Math.round(y2 - y1 + 2)}
              </textPath>
            </text>
          ),
        )}
      </g>
    </>
  );
};

const SnapViolations = ({
  paths,
  pointSize,
  ...props
}: {
  pointSize: number;
  paths: Path[];
} & PathProps<"strokeWidth", "d">) => {
  const lines = paths.filter(
    ({ c }) => c.type === 16 || c.type === 8 || c.type === 4 || c.type === 1,
  );

  const intersections: [Point, Point][] = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (i === j) continue;
      const { prev: p1, next: p2 } = lines[i];
      const { prev: p3, next: p4 } = lines[j];
      const denom =
        (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
      if (denom === 0) continue; // Parallel lines
      const x =
        ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
          (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
        denom;
      const y =
        ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
          (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
        denom;

      // skip if the intersection point is outside line[i]
      if (
        x < Math.min(p1.x, p2.x) - 0.01 ||
        x > Math.max(p1.x, p2.x) + 0.01 ||
        y < Math.min(p1.y, p2.y) - 0.01 ||
        y > Math.max(p1.y, p2.y) + 0.01
      )
        continue;

      // skip if already connected
      if (
        isDistanceSmaller(p3, { x, y }, 0.001) ||
        isDistanceSmaller(p4, { x, y }, 0.001)
      )
        continue;

      // do not snap to endpoints
      if (
        isDistanceSmaller(p1, { x, y }, 0.001) ||
        isDistanceSmaller(p2, { x, y }, 0.001)
      )
        continue;

      // move start if close to line
      if (
        isDistanceSmaller(p3, { x, y }, 0.5) &&
        lines[j].c.id !== lines[j - 1]?.c?.id
      ) {
        intersections.push([p3, { x, y }]);
      }

      // move end if close to line
      if (
        isDistanceSmaller(p4, { x, y }, 0.5) &&
        lines[j].c.id !== lines[j + 1]?.c?.id
      ) {
        intersections.push([p4, { x, y }]);
      }
    }
  }

  return (
    <g className="svg-preview-intersections-group" {...props}>
      {intersections.map(([a, b], idx) => (
        <>
          <circle
            cx={a.x}
            cy={a.y}
            r={pointSize / 2}
            fill="red"
            fillOpacity={0.5}
            stroke="red"
            key={`circle-${idx}`}
          />
          <path d={`M${a.x} ${a.y}h.01`} key={`line-${idx}`} stroke="red" />
          <circle
            cx={b.x}
            cy={b.y}
            r={pointSize / 2}
            fill="lime"
            fillOpacity={0.5}
            stroke="lime"
            key={`circle-${idx}`}
          />
          <path d={`M${b.x} ${b.y}h.01`} key={`line-${idx}`} stroke="lime" />
        </>
      ))}
    </g>
  );
};

const BorderViolationHighlight = ({
  paths,
  stroke,
  ...props
}: {
  paths: Path[];
} & PathProps<"stroke", "d">) => {
  return (
    <g className="svg-preview-border-violation-group">
      <defs xmlns="http://www.w3.org/2000/svg">
        <pattern
          id="svg-preview-border-violation-pattern"
          width=".1"
          height=".1"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45 50 50)"
        >
          <line stroke={stroke} strokeWidth={0.1} y2={1} />
          <line stroke={stroke} strokeWidth={0.1} y2={1} />
        </pattern>
      </defs>
      <mask id="svg-preview-border-violation-mask" maskUnits="userSpaceOnUse">
        <path d={paths.map(({ d }) => d).join(" ")} stroke="white" />
        <rect
          x={1}
          y={1}
          rx={1}
          width={"calc(100% - 2px)"}
          height={"calc(100% - 2px)"}
          fill="black"
          stroke="none"
        />
      </mask>
      <path
        {...props}
        d={paths.map(({ d }) => d).join(" ")}
        stroke="url(#svg-preview-border-violation-pattern)"
        mask="url(#svg-preview-border-violation-mask)"
      />
    </g>
  );
};

const SvgPreview = React.forwardRef<
  SVGSVGElement,
  {
    height?: number;
    width?: number;
    src: string | ReturnType<typeof getPaths>;
    showGrid?: boolean;
  } & React.SVGProps<SVGSVGElement>
>(
  (
    { src, children, height = 24, width = 24, showGrid = false, ...props },
    ref,
  ) => {
    const subGridSize =
      Math.max(height, width) % 3 === 0
        ? Math.max(height, width) > 24
          ? 12
          : 3
        : Math.max(height, width) % 5 === 0
          ? 5
          : 0;
    const paths = typeof src === "string" ? getPaths(src) : src;
    const patternMatches = mGetPatternMatches(paths);

    const darkModeCss = `
  .dark .svg
  .dark .svg-preview-grid-group,
  .dark .svg-preview-radii-group,
  .dark .svg-preview-shadow-mask-group,
  .dark .svg-preview-shadow-group {
    stroke: ###;
  }
`;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <style>{darkModeCss}</style>
        {showGrid && (
          <Grid
            height={height}
            width={width}
            subGridSize={patternMatches.length ? 0 : subGridSize}
            strokeWidth={0.1}
            stroke="#777"
            mask="url(#svg-preview-bounding-box-mask)"
            strokeOpacity={0.3}
            radius={1}
          />
        )}
        <Shadow
          paths={paths}
          strokeWidth={4}
          stroke="#777"
          radius={1}
          strokeOpacity={0.15}
        />
        <GapViolationHighlight
          paths={paths}
          stroke="red"
          strokeOpacity={0.75}
          strokeWidth={4}
        />
        <Handles
          paths={paths}
          strokeWidth={0.12}
          stroke="#777"
          strokeOpacity={0.6}
        />
        <ColoredPath
          paths={paths}
          colors={[
            "#1982c4",
            "#4267AC",
            "#6a4c93",
            "#B55379",
            "#FF595E",
            "#FF7655",
            "#ff924c",
            "#FFAE43",
            "#ffca3a",
            "#C5CA30",
            "#8ac926",
            "#52A675",
          ]}
        />
        <BorderViolationHighlight
          paths={paths}
          stroke="red"
          strokeOpacity={0.75}
        />
        <Radii
          paths={paths}
          strokeWidth={0.12}
          strokeDasharray="0 0.25 0.25"
          stroke="#777"
          strokeOpacity={0.3}
        />
        <ControlPath
          radius={1}
          paths={paths}
          pointSize={1}
          stroke="#fff"
          strokeWidth={0.125}
        />
        <SnapViolations paths={paths} pointSize={1} strokeWidth={0.125} />
        <Handles
          paths={paths}
          strokeWidth={0.12}
          stroke="#FFF"
          strokeOpacity={0.3}
        />
        <PatternMatches
          paths={paths}
          strokeWidth={0.12}
          stroke="#777"
          strokeOpacity={0.3}
        />

        {children}
      </svg>
    );
  },
);

SvgPreview.displayName = "SvgPreview";

export default SvgPreview;
