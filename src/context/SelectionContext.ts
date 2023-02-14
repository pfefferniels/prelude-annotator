import { UrlString } from "@inrupt/solid-client";
import { createContext } from "react";
import { Selection } from "../types/Selection";

type SelectionContextType = {
    highlightSelection: (targetUrl: UrlString) => void
    availableSelections: Selection[]
}

export const SelectionContext = createContext<SelectionContextType>({
    highlightSelection: () => {},
    availableSelections: []
})
