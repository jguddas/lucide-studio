import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import optimize from "@/components/IconEditor/optimize";
import {
  BrushIcon,
  DownloadIcon,
  MaximizeIcon,
  MinimizeIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import format from "./format";

const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [setIsFullscreen]);
  return isFullscreen;
};

const Menu = ({
  value,
  undo,
  redo,
  isMac,
  setValue,
}: {
  value: string;
  undo: () => void;
  redo: () => void;
  isMac: boolean;
  setValue: (value: string) => void;
}) => {
  const isFullscreen = useIsFullscreen();
  return (
    <Menubar className="border-t-transparent border-x-transparent rounded-none">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => {
              const svg = new Blob([value], { type: "image/svg+xml" });
              const url = URL.createObjectURL(svg);
              const a = document.createElement("a");
              a.href = url;
              a.download = "icon.svg";
              a.click();
            }}
            className="gap-1.5"
          >
            <DownloadIcon />
            Download
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={undo} className="gap-1.5">
            <UndoIcon />
            Undo
            <MenubarShortcut>{isMac ? "⌘Z" : "Ctrl+Z"}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={redo} className="gap-1.5">
            <RedoIcon />
            Redo
            <MenubarShortcut>{isMac ? "⇧⌘Z" : "Shift+Ctrl+Z"}</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onClick={() => setValue(format(value))}
            className="gap-1.5"
          >
            <BrushIcon />
            Format <MenubarShortcut>{isMac ? "⌘S" : "Ctrl+S"}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onClick={() => setValue(optimize(value))}
            className="gap-1.5"
          >
            <SparklesIcon />
            Tidy
            <MenubarShortcut>{isMac ? "⇧⌘S" : "Shift+Ctrl+S"}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => {
              if (isFullscreen) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="gap-1.5"
          >
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            Fullscreen
            <MenubarShortcut>{isMac ? "FN+F" : "F11"}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

Menu.displayName = "Menu";
export default Menu;
