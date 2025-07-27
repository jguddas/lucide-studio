import {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";
import { Path } from "./SvgPreview/types";

export type Selection = {
  startPosition: { x: number; y: number };
  type:
    | "svg-editor-path"
    | "svg-editor-start"
    | "svg-editor-end"
    | "svg-editor-circle"
    | "svg-editor-cp1"
    | "svg-editor-cp2"
    | "svg-preview-bounding-box-label";
} & Path;

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
