import { Drawer, IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { SelectionEditor } from "./SelectionEditor"
import Verovio from "./Verovio"
import { WorkPicker } from "./WorkPicker"
import { Menu } from "@mui/icons-material"
import { Stack } from "@mui/system"
import { asUrl, getSourceUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, removeThing, saveSolidDatasetAt, Thing } from "@inrupt/solid-client"
import { SelectionOverlay } from "./SelectionOverlay"
import { tab2cmn } from "./tab2cmn"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF } from "@inrupt/vocab-common-rdf"
import { crm } from "./namespaces"
import { SelectionContext } from "./SelectionContext"

export interface E13 {
    id: string
    treatise: string
    property: string
    attribute: string
    comment: string
}

type Reference = string | Selection

export interface Selection {
    id: string
    refs: (Reference)[]
    e13s: E13[]
}

export const isSelection = (ref: Reference): ref is Selection => {
    return (ref as Selection).refs !== undefined
}

type DisplayMode = 'staff-notation' | 'tablature'

export const Workspace = () => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [workURI, setWorkURI] = useState('')
    const [displayMode, setDispayMode] = useState<DisplayMode>('tablature')
    const [mei, setMEI] = useState('')
    const [transformedMEI, setTransformedMEI] = useState('')
    const [selections, setSelections] = useState<Selection[]>([])
    const [activeSelectionId, setActiveSelectionId] = useState('')
    const [secondaryActiveSelection, setSecondaryActiveSelection] = useState('')
    const [workPickerOpen, setWorkPickerOpen] = useState(true)

    const [verovioReady, setVerovioReady] = useState(0)
    const [hullContainer, setHullContainer] = useState<SVGGElement>()

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
        // somehow connect all the Attribute Assignments
    }

    const updateSelections = () => {
        if (!dataset) return

        console.log('update selections')

        const things = getThingAll(dataset)
        setSelections(
            things
                .filter(thing => {
                    // TODO: should use has_type instead
                    return getUrlAll(thing, RDF.type).includes(crm('E90_Symbolic_Object')) &&
                        getUrl(thing, crm('P106i_forms_part_of')) === workURI
                })
                .map(thing => {
                    const selectionUrl = asUrl(thing)
                    const refs = getUrlAll(thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

                    return {
                        id: selectionUrl.split('#').at(-1) || '',
                        refs: refs,
                        e13s: things
                            .filter(thing => {
                                // get all E13s connected to this selection
                                return getUrlAll(thing, RDF.type).includes(crm('E13_Attribute_Assignment')) &&
                                    getUrl(thing, crm('P140_assigned_attribute_to')) === selectionUrl
                            })
                            .map((thing): E13 => {
                                return {
                                    id: asUrl(thing).split('#').at(-1) || v4(),
                                    treatise: '', // TODO
                                    property: getUrl(thing, crm('P177_assigned_property_of_type')) || '',
                                    attribute: getUrl(thing, crm('P141_assigned')) || '',
                                    comment: getStringNoLocale(thing, crm('P3_has_note')) || ''
                                }
                            })
                    }
                })
        )
    }

    useEffect(updateSelections, [workURI, dataset])

    const startNewSelection = (ref: string) => {
        const id = v4()
        setSelections(selections => [...selections, {
            id,
            refs: [ref],
            e13s: []
        }])
        setActiveSelectionId(id)
    }

    const expandActiveSelection = (ref: string) => {
        const newSelections = selections.slice()
        newSelections.find(selection => selection.id === activeSelectionId)?.refs.push(ref)
        setSelections(newSelections)
    }

    const setSelection = (newSelection: Selection) => {
        // replace active selection id in list with newSelection
        const newSelections = selections.slice()
        const index = newSelections.findIndex(selection => selection.id === activeSelectionId)
        newSelections[index] = newSelection
        setSelections(newSelections)
    }

    const removeSelection = (id: string) => {
        const selectionToRemove = selections.find(selection => selection.id === id)
        if (dataset && selectionToRemove) {
            const sourceUrl = getSourceUrl(dataset)
            if (sourceUrl) {
                let modifiedDataset = removeThing(dataset, `${sourceUrl}#${selectionToRemove.id}`)
                selectionToRemove?.e13s.forEach(e13 => {
                    modifiedDataset = removeThing(dataset, `${sourceUrl}#${e13.id}`)
                })
                saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
            }
        }
        const newSelections = selections.slice()
        newSelections.splice(selections.findIndex(selection => selection.id === id), 1)
        setSelections(newSelections)
    }

    const removeFromActiveSelection = (ref: string) => {
        const newSelections = selections.slice()
        const index = newSelections.findIndex(selection => selection.id === activeSelectionId)
        const refs = newSelections[index].refs
        refs.splice(refs.findIndex(r => r === ref), 1)
        setSelections(newSelections)
    }

    if (workPickerOpen) {
        return (
            <WorkPicker
                open={true}
                onClose={() => setWorkPickerOpen(false)}
                setWorkURI={setWorkURI}
                setMEI={setMEI}
                setSelections={setSelections} />
        )
    }

    return (
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

            <SelectionContext.Provider
                value={{
                    availableSelections: selections.map(s => s.id),
                    highlightSelection: setSecondaryActiveSelection
                }}>
                <Drawer
                    variant='persistent'
                    open={activeSelectionId !== ''}
                    anchor='right'>
                    <SelectionEditor
                        workURI={workURI}
                        setSelection={setSelection}
                        selection={selections.find(selection => selection.id === activeSelectionId)} />
                </Drawer>

            </SelectionContext.Provider>


            {hullContainer && selections.map(selection => {
                return (
                    <SelectionOverlay
                        key={selection.id}
                        selection={selection}
                        highlight={selection.id === secondaryActiveSelection}
                        setActiveSelection={setActiveSelectionId}
                        removeSelection={removeSelection}
                        svgBackground={hullContainer} />
                )
            })}
        </div>
    )
}