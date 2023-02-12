import { createContext } from "react"
import { Argumentation } from "../types/Belief"

type ArgumentationContextType = {
    availableArgumentations: Argumentation[]
}

export const ArgumentationContext = createContext<ArgumentationContextType>({
    availableArgumentations: []
})
