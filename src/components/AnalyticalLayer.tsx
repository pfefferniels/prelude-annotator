import { asUrl, buildThing, createThing, getDate, getPodOwner, getPodUrlAll, getSolidDataset, getSourceUrl, getStringNoLocale, getThing, getThingAll, getUrl, getUrlAll, saveSolidDatasetAt, setThing, SolidDataset, Thing, UrlString } from "@inrupt/solid-client"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { RDF, DCTERMS } from "@inrupt/vocab-common-rdf"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { crminf, crm } from "../helpers/namespaces"
import { Ontology } from "../helpers/Ontology"
import { Argumentation, Belief, BeliefValue } from "../types/Belief"
import { E13 } from "../types/E13"
import { Selection } from "../types/Selection"
import { SelectionContainer } from "./SelectionContainer"
import availableTreatises from "./availableTreatises.json"
import { AnalysisContext } from "../context/AnalysisContext"
import { stringToColour } from "../helpers/string2color"

interface AnalyticalLayerProps {
    analysisUrl: UrlString
}

/**
 * This class represents a particular analysis, whether personal
 * or public, as a layer on top of an MEI surface.
 */
export const AnalyticalLayer = ({ analysisUrl }: AnalyticalLayerProps) => {
    const { session } = useSession()

    // from this point on, objects can be associated with one dataset 
    // in which the given analysis lives
    const [dataset, setDataset] = useState<SolidDataset>()

    // these are the typical parts of an analysis: selections, E13s, argumentations 
    // and an ontology to which the analysis refers
    const [ontologies, setOntologies] = useState<Ontology[]>([])
    const [selections, setSelections] = useState<Selection[]>([])
    const [e13s, setE13s] = useState<E13[]>([])
    const [argumentations, setArgumentations] = useState<Argumentation[]>([])

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

        // load the dataset to which the analysis belongs to
        const fetchDataset = async () => {
            try {
                const dataset = await getSolidDataset(analysisUrl, { fetch: session.fetch as any })
                setDataset(dataset)
            }
            catch (e) {
                console.log(e)
            }
        }

        fetchDataset()
    }, [analysisUrl])

    // maps a `Thing` from the database onto the correponding typescript object
    const updateArgumentations = (things: Thing[]) => {
        if (!dataset) {
            console.log('No dataset given to update the selections')
            return
        }

        const analysis = getThing(dataset, analysisUrl)
        if (!analysis) return

        setArgumentations(
            things
                .filter(thing => {
                    // get all the I1 Argumentations in the datasets
                    return getUrlAll(thing, RDF.type).includes(crminf('I1_Argumentation')) &&
                        getUrlAll(analysis, crm('P3_consists_of')).includes(asUrl(thing))
                })
                .map((argumentationThing): Argumentation => {
                    return {
                        url: asUrl(argumentationThing),
                        carriedOutBy: getUrl(argumentationThing, crm('P14_carried_out_by')) || '',
                        concluded:
                            things
                                .filter(thing => {
                                    const conclusions = getUrlAll(argumentationThing, crminf('J2_concluded_that'))
                                    // get all the I2 Beliefs
                                    return getUrlAll(thing, RDF.type).includes(crminf('I2_Belief')) &&
                                        conclusions.includes(asUrl(thing))
                                })
                                .map((thing): Belief => {
                                    return {
                                        url: asUrl(thing),
                                        time: getDate(thing, DCTERMS.created) || new Date(),
                                        that: getUrl(thing, crminf('J4_that'))?.split('#').at(-1) || '',
                                        holdsToBe: getStringNoLocale(thing, crminf('J5_holds_to_be')) as BeliefValue,
                                        note: getStringNoLocale(thing, crm('P3_has_note')) || ''
                                    }
                                }),
                        note: getStringNoLocale(argumentationThing, crm('P3_has_note')) || ''
                    }
                })
        )
    }

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
                .map((thing): E13 => {
                    return {
                        url: asUrl(thing),
                        treatise: getUrl(thing, crm('P33_used_specific_technique')) || '',
                        property: getUrl(thing, crm('P177_assigned_property_of_type')) || '',
                        attribute: getUrl(thing, crm('P141_assigned')) || '',
                        target: getUrl(thing, crm('P140_assigned_attribute_to')) || '',
                        comment: getStringNoLocale(thing, crm('P3_has_note')) || '',
                    }
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
                .map(thing => {
                    console.log('found!!')
                    const selectionUrl = asUrl(thing)
                    const refs = getUrlAll(thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

                    return {
                        url: selectionUrl,
                        refs: refs
                    }
                })
        )
    }

    // Whenever something in the dataset changes,
    // usually through some user action in one of the 
    // child components, keep the corresponding states up-to-date.
    useEffect(() => {
        if (!dataset) return

        const things = getThingAll(dataset)
        console.log('update dataset from', things.length)
        updateSelections(things)
        updateE13s(things)
        updateArgumentations(things)
    }, [dataset])

    return (
        <DatasetContext.Provider value={{
            solidDataset: dataset, setDataset
        }}>
            <AnalysisContext.Provider value={{
                availableOntologies: ontologies,
                availableArgumentations: argumentations,
                availableE13s: e13s,
                analysisUrl,
                editable: true,
                color: stringToColour(analysisUrl)
            }}>
                <SelectionContainer selections={selections} />
            </AnalysisContext.Provider>
        </DatasetContext.Provider >
    )
}
