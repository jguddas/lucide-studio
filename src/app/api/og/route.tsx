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
  const paths = getPaths(
    searchParams.get("value") ||
      `<path d="M14 12C14 9.79086 12.2091 8 10 8C7.79086 8 6 9.79086 6 12C6 16.4183 9.58172 20 14 20C18.4183 20 22 16.4183 22 12C22 8.446 20.455 5.25285 18 3.05557" />
    <path d="M10 12C10 14.2091 11.7909 16 14 16C16.2091 16 18 14.2091 18 12C18 7.58172 14.4183 4 10 4C5.58172 4 2 7.58172 2 12C2 15.5841 3.57127 18.8012 6.06253 21" />`,
  );
  const width = parseInt(
    searchParams.get("value")?.match(/width="(\d+)"/)?.[1] ?? "24",
  );
  const height = parseInt(
    searchParams.get("value")?.match(/height="(\d+)"/)?.[1] ?? "24",
  );
  let idx = 0;
  return new ImageResponse(
    (
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
              stroke={
                colors[(c.name === "path" ? idx++ : c.id) % colors.length]
              }
            />
          ))}
        </svg>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
