import { SolidDataset, Thing, UrlString } from "@inrupt/solid-client"
import { createContext } from "react"
import { Ontology } from "../helpers/Ontology"
import { Argumentation } from "../types/Belief"
import { E13 } from "../types/E13"

type AnalysisContextType = {
    analysisDataset?: SolidDataset,
    updateDataset: (modifiedDataset: SolidDataset) => void,
    analysisThing?: Thing,

    availableArgumentations: Argumentation[]
    availableE13s: E13[],
    availableOntologies: Ontology[]
    editable: boolean
    color: string
}

export const AnalysisContext = createContext<AnalysisContextType>({
    updateDataset: (_) => {},

    availableArgumentations: [],
    availableE13s: [],
    availableOntologies: [],
    editable: false,
    color: 'red'
})
