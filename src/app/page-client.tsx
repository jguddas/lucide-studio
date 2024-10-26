"use client";
import { useQueryState } from "next-usequerystate";
import IconEditor from "@/components/IconEditor";
import format from "@/components/IconEditor/format";
import optimize from "@/components/IconEditor/optimize";
import { useCallback, useEffect, useRef } from "react";
import Menu from "@/components/IconEditor/Menu";
import ContributionDialog from "@/components/ContributionDialog";
import { trim } from "@/components/IconEditor/trim";

export async function generateMetadata({ params, searchParams }: any) {
  const queryParams = new URLSearchParams({});

  return {
    title: "Lucide Studio",
    description: "Edit and create lucide icons",
    openGraph: {
      images: [{ url: `/api/og?${queryParams}` }],
    },
    twitter: {
      card: "summary_large_image",
      images: [{ url: `/api/og?${queryParams}` }],
    },
  };
}

const emptyState = format(
  `
    <path d="M14 12C14 9.79086 12.2091 8 10 8C7.79086 8 6 9.79086 6 12C6 16.4183 9.58172 20 14 20C18.4183 20 22 16.4183 22 12C22 8.446 20.455 5.25285 18 3.05557" />
    <path d="M10 12C10 14.2091 11.7909 16 14 16C16.2091 16 18 14.2091 18 12C18 7.58172 14.4183 4 10 4C5.58172 4 2 7.58172 2 12C2 15.5841 3.57127 18.8012 6.06253 21" />
  `,
);

const isMac =
  typeof window !== "undefined" && window.navigator.platform.startsWith("Mac");

const useValueState = () => {
  const [value, _setValue] = useQueryState("value", {
    defaultValue: emptyState,
    history: "push",
    parse: (query: string) => format(query),
    serialize: (value) => trim(value),
  });
  const pointer = useRef<number>(0);
  const history = useRef<string[]>([value]);

  const setValue = useCallback(
    (value: string | ((old: string) => string)) => {
      history.current = history.current.slice(0, pointer.current + 1);
      _setValue((old) => {
        const newValue = typeof value === "function" ? value(old) : value;
        if (newValue !== old) {
          history.current.push(newValue);
          pointer.current = history.current.length - 1;
        }
        return newValue;
      });
    },
    [_setValue],
  );

  const undo = useCallback(() => {
    pointer.current = Math.max(0, pointer.current - 1);
    if (history.current[pointer.current]) {
      _setValue(history.current[pointer.current]);
    }
  }, [_setValue]);

  const redo = useCallback(() => {
    pointer.current = Math.min(history.current.length - 1, pointer.current + 1);
    if (history.current[pointer.current]) {
      _setValue(history.current[pointer.current]);
    }
  }, [_setValue]);

  return [value, setValue, { undo, redo }] as const;
};

export default function PageClient() {
  const [value, setValue, { undo, redo }] = useValueState();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateIcon = () => {
      const link = (document.querySelector("link[rel*='icon']") ||
        document.createElement("link")) as HTMLLinkElement;

      const paths = Array.from(
        document.querySelectorAll(".svg-preview-colored-path-group > path"),
      );

      const width = value.match(/width="(\d+)"/)?.[1] ?? "24";
      const height = value.match(/height="(\d+)"/)?.[1] ?? "24";

      const icon = paths.length
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  ${paths
    .map((path) =>
      mediaQuery.matches
        ? path.outerHTML.replace(/stroke="[^\"]+"/g, 'stroke="white"')
        : path.outerHTML,
    )
    .join("\n")}
</svg>`
        : value;

      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = "data:image/svg+xml;utf8," + encodeURIComponent(icon);
      document.getElementsByTagName("head")[0].appendChild(link);
    };
    mediaQuery.addEventListener("change", updateIcon);
    const timeout = setTimeout(updateIcon, 400);
    return () => {
      mediaQuery.removeEventListener("change", updateIcon);
      clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeydown = (event: KeyboardEvent) => {
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (
        event.key === "z" &&
        event.shiftKey &&
        modifier &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        redo();
      } else if (
        event.key === "z" &&
        modifier &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        undo();
      } else if (event.key === "s" && event.shiftKey && modifier) {
        event.preventDefault();
        setValue((value) => optimize(value));
      } else if (event.key === "s" && modifier) {
        event.preventDefault();
        setValue((value) => format(value));
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [setValue, undo, redo]);

  return (
    <div className="flex flex-col">
      <Menu
        undo={undo}
        redo={redo}
        isMac={isMac}
        value={value}
        setValue={setValue}
      />
      <div className="flex flex-col m-12 gap-5">
        <IconEditor onChange={setValue} value={value} />
        <div className="flex justify-end">
          <ContributionDialog value={value} />
        </div>
      </div>
    </div>
  );
}
