import { createContext } from "react";

type SelectionContextType = {
    highlightSelection: (id: string) => void
    availableSelections: string[]
}

export const SelectionContext = createContext<SelectionContextType>({
    highlightSelection: () => {},
    availableSelections: []
})
