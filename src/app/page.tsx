"use client";
import { useQueryState } from "next-usequerystate";
import IconEditor from "@/components/IconEditor";
import format from "@/components/IconEditor/format";

const emptyState = format(
  '<path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />',
);

export default function Home() {
  const [value, setValue] = useQueryState("value", {
    defaultValue: emptyState,
    history: "push",
    parse: (query: string) => format(query),
  });

  return (
    <div className="flex flex-col m-12 gap-3">
      <IconEditor onChange={setValue} value={value} />
    </div>
  );
}
