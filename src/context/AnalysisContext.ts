import { UrlString } from "@inrupt/solid-client"
import { createContext } from "react"
import { Ontology } from "../helpers/Ontology"
import { Argumentation } from "../types/Belief"
import { E13 } from "../types/E13"

type AnalysisContextType = {
    analysisUrl: UrlString,
    availableArgumentations: Argumentation[]
    availableE13s: E13[],
    availableOntologies: Ontology[]
    editable: boolean
    color: string
}

export const AnalysisContext = createContext<AnalysisContextType>({
    analysisUrl: '',
    availableArgumentations: [],
    availableE13s: [],
    availableOntologies: [],
    editable: false,
    color: 'red'
})
