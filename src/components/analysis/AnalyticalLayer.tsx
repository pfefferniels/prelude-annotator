import { asUrl, getAgentAccess, getSolidDataset, getSolidDatasetWithAcl, getThing, getThingAll, getUrl, getUrlAll, SolidDataset, Thing, UrlString } from "@inrupt/solid-client"
import { useSession } from "@inrupt/solid-ui-react"
import { RDF } from "@inrupt/vocab-common-rdf"
import { useContext, useEffect, useState } from "react"
import { crm } from "../../helpers/namespaces"
import { Ontology } from "../../helpers/Ontology"
import { E13 } from "../../types/E13"
import { Selection } from "../../types/Selection"
import { SelectionContainer } from "../selection"
import availableTreatises from "../availableTreatises.json"
import { AnalysisContext } from "../../context/AnalysisContext"
import { stringToColour } from "../../helpers/string2color"
import { toE13 } from "../../mappings/mapE13"
import { toSelection } from "../../mappings/mapSelection"
import { createPortal } from "react-dom"
import { WorkspaceContext } from "../../context/ScoreSurfaceContext"

interface AnalyticalLayerProps {
    analysisUrl: UrlString
    active: boolean
}

/**
 * This class represents a particular analysis, whether personal
 * or public, as a layer on top of an MEI surface.
 */
export const AnalyticalLayer = ({ analysisUrl, active }: AnalyticalLayerProps) => {
    const { selectionPanel } = useContext(WorkspaceContext)
    const { session } = useSession()

    // from this point on, objects can be associated with one dataset 
    // in which the given analysis lives
    const [dataset, setDataset] = useState<SolidDataset>()

    // these are the typical parts of an analysis: selections, E13s, argumentations 
    // and an ontology to which the analysis refers
    const [ontologies, setOntologies] = useState<Ontology[]>([])
    const [selections, setSelections] = useState<Selection[]>([])
    const [e13s, setE13s] = useState<E13[]>([])
    const [editable, setEditable] = useState(false)

    useEffect(() => {
        // TODO: The used ontologies should also be deduced 
        // from the given E7, using the `used specific technique`
        // property. For now, simply load all available ontologies.
        const fetchOntologies = (treatises: any[]) => {
            return treatises.map(async treatise => {
                return new Ontology(await getSolidDataset(treatise.url), treatise.name, treatise.label)
            })
        }

        Promise.all(fetchOntologies(availableTreatises)).then(setOntologies)

        // load the dataset the analysis belongs to
        const fetchDataset = async () => {
            try {
                const dataset = await getSolidDatasetWithAcl(analysisUrl, { fetch: session.fetch as any })
                setDataset(dataset)

                // check the rights - are we allowed to edit this layer?
                if (!session.info.isLoggedIn || !session.info.webId) {
                    setEditable(false)
                    return
                }
                const rights = await getAgentAccess(dataset, session.info.webId)
                rights && setEditable(rights?.write)
            }
            catch (e) {
                console.log(`
                    fetching the dataset with ACL failed. Attempting to fetch it without ACL 
                    and assuming that no edit access exists.`)
                const dataset = await getSolidDataset(analysisUrl, { fetch: session.fetch as any })
                setDataset(dataset)
                setEditable(false)
            }
        }

        fetchDataset()
    }, [analysisUrl, session])

    const updateE13s = (things: Thing[]) => {
        if (!dataset) {
            console.log('No dataset given to update the selections')
            return
        }

        const analysis = getThing(dataset, analysisUrl)
        if (!analysis) return

        setE13s(
            things
                .filter(thing => {
                    // get all E13s connected to this selection
                    return getUrlAll(thing, RDF.type).includes(crm('E13_Attribute_Assignment')) &&
                        getUrlAll(analysis, crm('P3_consists_of')).includes(asUrl(thing))
                })
                .map(thing => {
                    // does the E13 point to a selection?
                    let selection: (Selection | undefined) = undefined
                    const assigned = getUrl(thing, crm('P141_assigned'))
                    if (assigned) {
                        const assignedSelection = getThing(dataset, assigned)
                        if (assignedSelection &&
                            getUrlAll(assignedSelection, RDF.type).includes(crm('E90_Symbolic_Object'))) {
                            selection = toSelection(assignedSelection)
                        }
                    }

                    return toE13(thing, selection)
                })
        )
    }

    const updateSelections = (things: Thing[]) => {
        if (!dataset) {
            console.log('No dataset given to update the selections')
            return
        }

        const analysis = getThing(dataset, analysisUrl)
        if (!analysis) return

        setSelections(
            things
                .filter(thing => {
                    // TODO: should use has_type instead
                    return getUrlAll(thing, RDF.type).includes(crm('E90_Symbolic_Object')) &&
                        getUrlAll(analysis, crm('P16_used_specific_object')).includes(asUrl(thing))
                })
                .map(toSelection)
        )
    }

    // Whenever something in the dataset changes,
    // usually through some user action in one of the 
    // child components, keep the corresponding states up-to-date.
    useEffect(() => {
        if (!dataset) return

        const things = getThingAll(dataset)
        updateSelections(things)
        updateE13s(things)
    }, [dataset])

    return (
        <AnalysisContext.Provider value={{
            analysisDataset: dataset,
            updateDataset: setDataset,
            availableOntologies: ontologies,
            availableE13s: e13s,
            analysisThing: (dataset && getThing(dataset, analysisUrl)) || undefined,
            editable,
            color: stringToColour(analysisUrl.split('#').at(-1) || analysisUrl)
        }}>
            {selectionPanel.current &&
                <SelectionContainer selections={selections} active={active} />}
        </AnalysisContext.Provider>
    )
}
