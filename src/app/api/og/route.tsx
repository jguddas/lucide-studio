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
  const paths = getPaths(searchParams.get("value") || "");
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
          style={{ width: 400, height: 400 }}
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
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
