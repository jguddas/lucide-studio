import { ImageResponse } from "next/og";
import getPaths from "@/components/SvgPreview/utils";

export const runtime = "edge";

const colors = [
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
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const value =
    atob(searchParams.get("value") || "") ||
    `  <path d="M10 12a4 4 0 0 0 8 0 8 8 0 0 0-16 0 12 12 0 0 0 4.063 9" />
  <path d="M14 12a4 4 0 0 0-8 0 8 8 0 0 0 16 0 12 12 0 0 0-4-8.944" />`;

  const paths = getPaths(value);
  const width = parseInt(
    (value.includes("svg") ? value.match(/width="(\d+)"/)?.[1] : null) ?? "24",
  );
  const height = parseInt(
    (value.includes("svg") ? value.match(/height="(\d+)"/)?.[1] : null) ?? "24",
  );
  let idx = 0;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        fontSize: 84,
        gap: 24,
        color: "black",
        background: "white",
        width: "100%",
        height: "100%",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        style={{
          width: 400 * (width / height > 1 ? 1 : width / height),
          height: 400 * (height / width > 1 ? 1 : height / width),
        }}
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map(({ d, c }, i) => (
          <path
            key={i}
            d={d}
            stroke={colors[(c.name === "path" ? idx++ : c.id) % colors.length]}
          />
        ))}
      </svg>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
