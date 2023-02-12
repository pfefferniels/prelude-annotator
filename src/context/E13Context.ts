import { createContext } from "react";
import { E13 } from "../types/E13";

type E13ContextType = {
    availableE13s: E13[]
}

export const E13Context = createContext<E13ContextType>({
    availableE13s: []
})
