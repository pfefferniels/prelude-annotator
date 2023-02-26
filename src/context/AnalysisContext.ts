import { SolidDataset, Thing } from "@inrupt/solid-client"
import { createContext } from "react"
import { Ontology } from "../helpers/Ontology"
import { E13 } from "../types/E13"

type AnalysisContextType = {
    analysisDataset?: SolidDataset,
    updateDataset: (modifiedDataset: SolidDataset) => void,
    analysisThing?: Thing,

    availableE13s: E13[],
    availableOntologies: Ontology[]
    editable: boolean
    color: string
}

export const AnalysisContext = createContext<AnalysisContextType>({
    updateDataset: (_) => {},

    availableE13s: [],
    availableOntologies: [],
    editable: false,
    color: 'red'
})
