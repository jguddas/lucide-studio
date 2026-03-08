import {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";
import { Path, PathArc, PathCurve } from "@/lib/get-paths";

export type Selection = Pick<Path, keyof Path> & {
  circle?: PathArc["circle"];
  cp1?: PathCurve["cp1"];
  cp2?: PathCurve["cp2"];
  startPosition: { x: number; y: number };
  selectionType:
    | "svg-editor-path"
    | "svg-editor-start"
    | "svg-editor-end"
    | "svg-editor-circle"
    | "svg-editor-cp1"
    | "svg-editor-cp2"
    | "svg-editor-radius"
    | "svg-preview-bounding-box-label";
};

const SelectionContext = createContext<
  | [selected: Selection[], setSelected: Dispatch<SetStateAction<Selection[]>>]
  | undefined
>(undefined);

export const SelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selected, setSelected] = useState<Selection[]>([]);

  return (
    <SelectionContext.Provider value={[selected, setSelected]}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
};
