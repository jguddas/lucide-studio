import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import optimize from "@/components/IconEditor/optimize";
import {
  BrushIcon,
  DownloadIcon,
  FolderUpIcon,
  LogOutIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  RedoIcon,
  SparklesIcon,
  SunIcon,
  UndoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import format from "./format";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";

const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!global.window?.document.fullscreenElement,
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
  const { theme, setTheme } = useTheme();
  const session = useSession();

  return (
    <Menubar className="border-t-transparent border-x-transparent rounded-none">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/svg+xml";
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  // @ts-ignore
                  setValue(format(reader.result));
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="gap-1.5"
          >
            <FolderUpIcon />
            Load SVG from disk
          </MenubarItem>
          <MenubarSeparator />
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
            Download as SVG
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
          <MenubarSub>
            <MenubarSubTrigger className="gap-1.5">
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
              Theme
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                <MenubarRadioItem value="system">System</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>
      {session.status === "authenticated" && session.data.user && (
        <MenubarMenu>
          <MenubarTrigger className="!ml-auto">
            {session.data.user.name}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => signOut()} className="gap-1.5">
              <LogOutIcon />
              Logout
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      )}
    </Menubar>
  );
};

Menu.displayName = "Menu";
export default Menu;
