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
  BracesIcon,
  BrushIcon,
  CircleOffIcon,
  CodeXmlIcon,
  CropIcon,
  DownloadIcon,
  DraftingCompassIcon,
  ExternalLinkIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  FolderUpIcon,
  LogOutIcon,
  LucideBoxSelect,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  RedoIcon,
  ScalingIcon,
  SunIcon,
  TextSelectionIcon,
  UndoIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useQueryState } from "next-usequerystate";
import arcify from "./arcify";
import scale from "./scale";
import { toDataCode } from "./toDataCode";
import { toReactCode } from "./toReactCode";
import crop from "./crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import offify from "./offify";
import flip from "./flip";

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

const scaleDialogSchema = z.object({
  height: z.string().regex(/^\d+$/),
  width: z.string().regex(/^\d+$/),
});

const cropDialogSchema = z.object({
  x: z.string().regex(/^\d+$/),
  y: z.string().regex(/^\d+$/),
  width: z.string().regex(/^\d+$/),
  height: z.string().regex(/^\d+$/),
});

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
  const [name, setName] = useQueryState("name");
  const isFullscreen = useIsFullscreen();
  const { theme, setTheme } = useTheme();
  const session = useSession();

  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const scaleDialogForm = useForm<z.infer<typeof scaleDialogSchema>>({
    resolver: zodResolver(scaleDialogSchema),
    defaultValues: { height: "24", width: "24" },
  });

  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const cropDialogForm = useForm<z.infer<typeof cropDialogSchema>>({
    resolver: zodResolver(cropDialogSchema),
    defaultValues: { x: "0", y: "0", width: "24", height: "24" },
  });

  return (
    <>
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
                  if (!file.name) {
                    setName(file.name.split(".")[0]);
                  }
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
                a.download = `${name || "icon"}.svg`;
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
              <MenubarShortcut>
                {isMac ? "⇧⌘Z" : "Shift+Ctrl+Z"}
              </MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => setValue(optimize(value))}
              className="gap-1.5"
            >
              <WandSparklesIcon />
              Tidy
              <MenubarShortcut>
                {isMac ? "⇧⌘S" : "Shift+Ctrl+S"}
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              onClick={() => setValue(arcify(value))}
              className="gap-1.5"
            >
              <DraftingCompassIcon />
              Arcify
            </MenubarItem>
            {JSON.parse(session.data?.user?.image || "{}").role === "admin" && (
              <MenubarItem
                onClick={async () => {
                  const promise = offify(value);
                  toast.promise(promise, {
                    loading: "Processing SVG...",
                    success: "SVG processed successfully!",
                    error: "An error occurred while processing the SVG.",
                  });
                  setValue(await promise);
                }}
                className="gap-1.5"
              >
                <CircleOffIcon />
                Offify
              </MenubarItem>
            )}
            <MenubarSeparator />
            <MenubarItem
              onClick={() => setValue(flip(value, "horizontal"))}
              className="gap-1.5"
            >
              <FlipHorizontalIcon />
              Flip horizontal
            </MenubarItem>
            <MenubarItem
              onClick={() => setValue(flip(value, "vertical"))}
              className="gap-1.5"
            >
              <FlipVerticalIcon />
              Flip vertical
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => setIsScaleDialogOpen(true)}
              className="gap-1.5"
            >
              <ScalingIcon />
              Scale
            </MenubarItem>
            <MenubarItem
              onClick={() => setIsCropDialogOpen(true)}
              className="gap-1.5"
            >
              <CropIcon />
              Crop
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
            <MenubarItem
              onClick={() => {
                window.open(
                  `https://lucide.dev/api/gh-icon/dpi/24/${Buffer.from(value).toString("base64")}.svg`,
                  "_blank",
                );
              }}
              className="gap-1.5"
            >
              <ExternalLinkIcon />
              Open DPI preview
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Share</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                window.navigator.clipboard.writeText(
                  `<a title="Open lucide studio" target="_blank" href="${
                    window.location.href
                  }"><img alt="icons" width="200px" src="https://lucide.dev/api/gh-icon/${Buffer.from(
                    value,
                  ).toString("base64")}.svg"/><br/>Open lucide studio</a>`,
                );
              }}
              className="gap-1.5"
            >
              <TextSelectionIcon />
              Copy preview embed code to clipboard
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                toDataCode(value, name).then((data) =>
                  window.navigator.clipboard.writeText(data),
                );
              }}
              className="gap-1.5"
            >
              <BracesIcon />
              Copy data code to clipboard
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                toReactCode(value, name).then((data) =>
                  window.navigator.clipboard.writeText(data),
                );
              }}
              className="gap-1.5"
            >
              <CodeXmlIcon />
              Copy react code to clipboard
            </MenubarItem>
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
      <Dialog
        open={isScaleDialogOpen}
        onOpenChange={() => setIsScaleDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scale content and resize canvas</DialogTitle>
          </DialogHeader>
          <Form {...scaleDialogForm}>
            <form
              onSubmit={scaleDialogForm.handleSubmit((data) => {
                setValue(
                  scale(value, parseInt(data.width), parseInt(data.height)),
                );
                setIsScaleDialogOpen(false);
              })}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <FormField
                  control={scaleDialogForm.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Width<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scaleDialogForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Height<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="gap-1.5">
                  <ScalingIcon />
                  Scale
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCropDialogOpen}
        onOpenChange={() => setIsCropDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize canvas without scaling content</DialogTitle>
          </DialogHeader>
          <Form {...cropDialogForm}>
            <form
              onSubmit={cropDialogForm.handleSubmit((data) => {
                setValue(
                  crop(value, [
                    parseInt(data.x) + 2,
                    parseInt(data.y) + 2,
                    parseInt(data.x) + parseInt(data.width) - 2,
                    parseInt(data.y) + parseInt(data.height) - 2,
                  ]),
                );
                setIsCropDialogOpen(false);
              })}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <FormField
                  control={cropDialogForm.control}
                  name="x"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        X<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cropDialogForm.control}
                  name="y"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Y<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cropDialogForm.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Width<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cropDialogForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Height<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} aria-required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setValue(crop(value));
                    setIsCropDialogOpen(false);
                  }}
                  className="gap-1.5"
                >
                  <LucideBoxSelect />
                  Crop to bounds
                </Button>
                <Button type="submit" className="gap-1.5">
                  <CropIcon />
                  Crop
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

Menu.displayName = "Menu";
export default Menu;
