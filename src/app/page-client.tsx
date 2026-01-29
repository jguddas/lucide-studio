"use client";
import { useQueryState } from "next-usequerystate";
import IconEditor from "@/components/IconEditor";
import format from "@/components/IconEditor/format";
import optimize from "@/components/IconEditor/optimize";
import { useCallback, useEffect, useRef } from "react";
import Menu from "@/components/IconEditor/Menu";
import ContributionDialog from "@/components/ContributionDialog";
import { trim } from "@/components/IconEditor/trim";
import { SelectionProvider } from "@/components/SelectionProvider";

const emptyState = format(
  `
  <path d="M10 12a4 4 0 0 0 8 0 8 8 0 0 0-16 0 12 12 0 0 0 4.063 9" />
  <path d="M14 12a4 4 0 0 0-8 0 8 8 0 0 0 16 0 12 12 0 0 0-4-8.944" />
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
            path.outerHTML.replace(
              /stroke="[^\"]+"/g,
              'stroke="white" stroke-width="4.5"',
            ),
          )
          .join("\n")}
        ${paths.map((path) => path.outerHTML).join("\n")}
</svg>`
        : value;

      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = "data:image/svg+xml;utf8," + encodeURIComponent(icon);
      document.getElementsByTagName("head")[0].appendChild(link);
    };
    const timeout = setTimeout(updateIcon, 400);
    return () => clearTimeout(timeout);
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
    <SelectionProvider>
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
    </SelectionProvider>
  );
}
