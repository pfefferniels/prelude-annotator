import { Drawer, IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useContext, useEffect, useState } from "react"
import { v4 } from "uuid"
import { SelectionEditor } from "./SelectionEditor"
import Verovio from "./Verovio"
import { WorkPicker } from "./WorkPicker"
import { Menu } from "@mui/icons-material"
import { Stack } from "@mui/system"
import { asUrl, buildThing, createThing, getDate, getSolidDataset, getSourceUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, hasResourceInfo, removeThing, saveSolidDatasetAt, setThing, SolidDataset, Thing } from "@inrupt/solid-client"
import { SelectionOverlay } from "./SelectionOverlay"
import { tab2cmn } from "../helpers/tab2cmn"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { DCTERMS, RDF } from "@inrupt/vocab-common-rdf"
import { crm, crminf, dcterms } from "../helpers/namespaces"
import { SelectionContext } from "../context/SelectionContext"
import { Argumentation, Belief, BeliefValue } from "../types/Belief"
import { ArgumentationContext } from "../context/ArgumentationContext"
import { E13Context } from "../context/E13Context"
import { Selection } from "../types/Selection"
import { Provenience } from "../types/Provenience"
import { E13 } from "../types/E13"
import { Ontology } from "../helpers/Ontology"
import { OntologyContext } from "../context/OntologyContext"
import availableTreatises from "./availableTreatises.json"

type DisplayMode = 'staff-notation' | 'tablature'

type ThingWithProvenience = {
    thing: Thing
} & Provenience

export const Workspace = () => {
    const { solidDataset: personalDataset, setDataset: setPersonalDataset } = useContext(DatasetContext)
    const { session } = useSession()

    const [sourceDataset, setSourceDataset] = useState<SolidDataset>()
    const [work, setWork] = useState<Thing>()
    const [displayMode, setDispayMode] = useState<DisplayMode>('tablature')
    const [mei, setMEI] = useState('')
    const [transformedMEI, setTransformedMEI] = useState('')

    const [activeSelectionId, setActiveSelectionId] = useState('')
    const [secondaryActiveSelection, setSecondaryActiveSelection] = useState('')
    const [workPickerOpen, setWorkPickerOpen] = useState(true)

    const [verovioReady, setVerovioReady] = useState(0)
    const [hullContainer, setHullContainer] = useState<SVGGElement>()

    const [ontologies, setOntologies] = useState<Ontology[]>([])
    const [selections, setSelections] = useState<Selection[]>([])
    const [e13s, setE13s] = useState<E13[]>([])
    const [argumentations, setArgumentations] = useState<Argumentation[]>([])

    // Add a <g> element to the SVG generated by verovio
    // which serves as a container for the overlays
    // that outline selections in the score
    useEffect(() => {
        if (!verovioReady) return

        const svg = document.querySelector('.verovio svg')
        if (!svg) {
            console.log('no SVG element found')
            return
        }

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('id', 'hulls')
        const firstSystem = svg.querySelector('.system')
        if (!firstSystem) return

        firstSystem.parentElement?.insertBefore(g, firstSystem)
        setHullContainer(g)
    }, [verovioReady])

    // once the MEI file changes, make sure to have 
    // a CMN transcription immediately available
    useEffect(() => {
        if (!mei || mei.length === 0) return
        setTransformedMEI(tab2cmn(mei))
    }, [mei])

    const saveToPod = () => {
        // Argumentations, E13s and selections are being updated 
        // in their respective components. Here we connect them 
        // all into one E7 Activity.
    }

    const updateArgumentations = (things: ThingWithProvenience[]) => {
        setArgumentations(
            things
                .filter(thing => {
                    // get all the I1 Argumentations in the datasets
                    return getUrlAll(thing.thing, RDF.type).includes(crminf('I1_Argumentation'))
                })
                .map((argumentationThing): Argumentation => {
                    return {
                        url: asUrl(argumentationThing.thing),
                        carriedOutBy: getUrl(argumentationThing.thing, crm('P14_carried_out_by')) || '',
                        concluded:
                            things
                                .filter(thing => {
                                    const conclusions = getUrlAll(argumentationThing.thing, crminf('J2_concluded_that'))
                                    // get all the I2 Beliefs
                                    return getUrlAll(thing.thing, RDF.type).includes(crminf('I2_Belief')) &&
                                        conclusions.includes(asUrl(thing.thing))
                                })
                                .map((thing): Belief => {
                                    return {
                                        url: asUrl(thing.thing),
                                        time: getDate(thing.thing, DCTERMS.created) || new Date(),
                                        that: getUrl(thing.thing, crminf('J4_that'))?.split('#').at(-1) || '',
                                        holdsToBe: getStringNoLocale(thing.thing, crminf('J5_holds_to_be')) as BeliefValue
                                    }
                                })
                    }
                })
        )
    }

    const updateE13s = (things: ThingWithProvenience[]) => {
        setE13s(
            things
                .filter(thing => {
                    // get all E13s connected to this selection
                    return getUrlAll(thing.thing, RDF.type).includes(crm('E13_Attribute_Assignment'))
                })
                .map((thing): E13 => {
                    return {
                        id: asUrl(thing.thing).split('#').at(-1) || v4(),
                        treatise: getUrl(thing.thing, crm('P33_used_specific_technique')) || '',
                        property: getUrl(thing.thing, crm('P177_assigned_property_of_type')) || '',
                        attribute: getUrl(thing.thing, crm('P141_assigned')) || '',
                        target: getUrl(thing.thing, crm('P140_assigned_attribute_to')) || '',
                        comment: getStringNoLocale(thing.thing, crm('P3_has_note')) || '',
                        provenience: thing.provenience
                    }
                })
        )
    }

    const updateSelections = (things: ThingWithProvenience[]) => {
        setSelections(
            things
                .filter(thing => {
                    // TODO: should use has_type instead
                    return getUrlAll(thing.thing, RDF.type).includes(crm('E90_Symbolic_Object')) &&
                        getUrl(thing.thing, crm('P106i_forms_part_of')) === asUrl(work!)
                })
                .map(thing => {
                    const selectionUrl = asUrl(thing.thing)
                    const refs = getUrlAll(thing.thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

                    return {
                        id: selectionUrl.split('#').at(-1) || '',
                        provenience: thing.provenience || '',
                        refs: refs
                    }
                })
        )
    }

    // Whenever the work itself, the source dataset or the   
    // personal dataset changes, update all the selections.
    useEffect(() => {
        if (!sourceDataset) return

        // collect the annotations from both datasets, 
        // the personal as well as the source dataset.
        let things: ThingWithProvenience[] = []
        if (!session.info.isLoggedIn) {
            things = getThingAll(sourceDataset).map(thing => ({
                provenience: getSourceUrl(sourceDataset) || '',
                thing
            }))
        }
        else if (personalDataset && getSourceUrl(sourceDataset) === getSourceUrl(personalDataset)) {
            things = getThingAll(personalDataset).map(thing => ({
                provenience: getSourceUrl(personalDataset) || '',
                thing
            }))
        }
        else {
            things = [
                ...getThingAll(sourceDataset).map(thing => ({
                    provenience: getSourceUrl(sourceDataset) || '',
                    thing
                })),
                ...(personalDataset ? getThingAll(personalDataset).map(thing => ({
                    provenience: getSourceUrl(personalDataset) || '',
                    thing
                })) : [])
            ]
        }
        console.log('update selections from a dataset with', things, 'items')

        updateSelections(things)
        updateE13s(things)
        updateArgumentations(things)
    }, [work, sourceDataset, personalDataset])

    useEffect(() => {
        if (ontologies.length !== 0) return

        // load all the existing ontologies when mounting
        // the component. In future it might make sense to
        // predefine a selection of ontologies
        const fetchOntologies = (treatises: any[]) => {
            return treatises.map(async treatise => {
                return new Ontology(await getSolidDataset(treatise.url), treatise.name, treatise.label)
            })
        }

        Promise.all(fetchOntologies(availableTreatises)).then(setOntologies)
    }, [])

    const saveSelection = async (selection: Selection) => {
        if (!selection || !work) return

        if (!personalDataset || !hasResourceInfo(personalDataset)) {
            console.warn('No dataset found to save the new work to.')
            return
        }

        // saves the given selection in the POD
        const selectionThing = buildThing(createThing({
            name: selection.id
        }))
            .addUrl(RDF.type, crm('E90_Symbolic_Object'))
            .addDate(DCTERMS.created, new Date(Date.now()))
            .addUrl(crm('P106i_forms_part_of'), asUrl(work))

        selection.refs.forEach(ref => {
            selectionThing.addUrl(crm('P106_is_composed_of'), `${asUrl(work)}#${ref}`)
        })

        const modifiedDataset = setThing(personalDataset, selectionThing.build());
        const savedDataset = await saveSolidDatasetAt(getSourceUrl(modifiedDataset), modifiedDataset, { fetch: session.fetch as any });
        setPersonalDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
    }

    const startNewSelection = (ref: string) => {
        if (!session.info.isLoggedIn) {
            console.log('Cannot create a new selection without being logged in')
            return
        }

        if (!personalDataset || !hasResourceInfo(personalDataset)) {
            console.log('Cannot create selection without having a dataset defined.')
            return
        }

        const id = v4()
        const newSelection = {
            id,
            provenience: getSourceUrl(personalDataset),
            refs: [ref],
            e13s: []
        }
        // setSelections(selections => [...selections, newSelection])
        saveSelection(newSelection)
        setActiveSelectionId(id)
    }

    const expandActiveSelection = (ref: string) => {
        const newSelections = selections.slice()
        const toChange = selections.find(selection => selection.id === activeSelectionId)
        if (!toChange) return 
        toChange.refs.push(ref)
        saveSelection(toChange)
        // setSelections(newSelections)
    }

    const setSelection = (newSelection: Selection) => {
        // replace active selection id in list with newSelection
        const newSelections = selections.slice()
        const index = newSelections.findIndex(selection => selection.id === activeSelectionId)
        newSelections[index] = newSelection
        setSelections(newSelections)
    }

    const removeSelection = async (id: string) => {
        if (!session.info.isLoggedIn) {
            console.log('Cannot remove a selection without being logged in.')
            return
        }

        if (!personalDataset || !hasResourceInfo(personalDataset)) {
            console.log('No personal dataset to remove from.')
            return
        }

        const selectionToRemove = selections.find(selection => selection.id === id)
        if (!selectionToRemove) {
            console.log('No selection to remove.')
            return
        }

        if (selectionToRemove?.provenience !== getSourceUrl(personalDataset)) {
            console.log('Cannot remove a selection which is not your own.')
            return
        }

        if (activeSelectionId === id) setActiveSelectionId('')

        const sourceUrl = getSourceUrl(personalDataset)
        let modifiedDataset = removeThing(personalDataset, `${sourceUrl}#${selectionToRemove.id}`)

        // Also remove all the E13s that were associated with this selection
        e13s
            .filter(e13 => e13.target === `${sourceUrl}#${selectionToRemove.id}`)
            .forEach(e13 => {
                modifiedDataset = removeThing(personalDataset, `${sourceUrl}#${e13.id}`)
            })

        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
        setPersonalDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
        console.log('Selection succesfully removed from your personal dataset')
    }

    const removeFromActiveSelection = (ref: string) => {
        const newSelections = selections.slice()
        const index = newSelections.findIndex(selection => selection.id === activeSelectionId)
        const refs = newSelections[index].refs
        refs.splice(refs.findIndex(r => r === ref), 1)
        setSelections(newSelections)
    }

    return (
        <>
            <div style={{ margin: '1rem' }}>
                <Stack direction='row'>
                    <IconButton onClick={() => setWorkPickerOpen(true)}>
                        <Menu />
                    </IconButton>

                    <ToggleButtonGroup
                        exclusive
                        size='small'
                        value={displayMode}
                        onChange={(e, newMode) => setDispayMode(newMode as DisplayMode)}>
                        <ToggleButton value='tablature' key='tablature'>
                            Tablature
                        </ToggleButton>
                        <ToggleButton value='staff-notation' key='staff-notation'>
                            Staff notation
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <Verovio
                    mei={displayMode === 'tablature' ? mei : transformedMEI}
                    expandActiveSelection={expandActiveSelection}
                    removeFromActiveSelection={removeFromActiveSelection}
                    startNewSelection={startNewSelection}
                    onReady={() => setVerovioReady(verovioReady + 1)} />

                {work && (
                    <OntologyContext.Provider value={{
                        availableOntologies: ontologies
                    }}>
                        <ArgumentationContext.Provider
                            value={{
                                availableArgumentations: argumentations
                            }}>
                            <E13Context.Provider
                                value={{
                                    availableE13s: e13s
                                }}>
                                <SelectionContext.Provider
                                    value={{
                                        availableSelections: selections.map(s => s.id),
                                        highlightSelection: setSecondaryActiveSelection
                                    }}>
                                    {session.info.isLoggedIn ? (
                                        <Drawer
                                            variant='persistent'
                                            open={activeSelectionId !== ''}
                                            anchor='right'>
                                            <SelectionEditor
                                                setSelection={setSelection}
                                                selection={selections.find(selection => selection.id === activeSelectionId)} />
                                        </Drawer>
                                    ) : null /* otherwise just show popups containing the information */}

                                </SelectionContext.Provider>
                            </E13Context.Provider>
                        </ArgumentationContext.Provider>
                    </OntologyContext.Provider>
                )}


                {hullContainer && selections.map(selection => {
                    return (
                        <SelectionOverlay
                            key={`${displayMode}_${selection.id}`}
                            selection={selection}
                            highlight={selection.id === secondaryActiveSelection}
                            setActiveSelection={setActiveSelectionId}
                            removeSelection={removeSelection}
                            svgBackground={hullContainer} />
                    )
                })}
            </div>

            {workPickerOpen && (
                <WorkPicker
                    open={true}
                    onClose={() => setWorkPickerOpen(false)}
                    setSourceDataset={setSourceDataset}
                    setWork={setWork}
                    setMEI={setMEI}
                    setSelections={setSelections} />
            )}
        </>
    )
}
