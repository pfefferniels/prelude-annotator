import { createContext } from "react"
import { Ontology } from "../helpers/Ontology"

type OntologyContextType = {
    availableOntologies: Ontology[]
}

export const OntologyContext = createContext<OntologyContextType>({
    availableOntologies: []
})
