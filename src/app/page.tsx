"use client";
import { useQueryState } from "next-usequerystate";
import IconEditor from "@/components/IconEditor";
import format from "@/components/IconEditor/format";
import optimize from "@/components/IconEditor/optimize";
import { useCallback, useEffect, useRef } from "react";
import Menu from "@/components/IconEditor/Menu";
import ContributionDialog from "@/components/ContributionDialog";

const emptyState = format(
  '<path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9" />',
);

const isMac =
  typeof window !== "undefined" && window.navigator.platform.startsWith("Mac");

const useValueState = () => {
  const [value, _setValue] = useQueryState("value", {
    defaultValue: emptyState,
    history: "push",
    parse: (query: string) => format(query),
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

export default function Home() {
  const [value, setValue, { undo, redo }] = useValueState();

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
