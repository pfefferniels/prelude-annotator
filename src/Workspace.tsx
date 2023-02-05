import { Button, IconButton, menuItemClasses, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { SelectionEditor } from "./SelectionEditor"
import { SelectionList } from "./SelectionList"
import Verovio from "./Verovio"
import { WorkPicker } from "./WorkPicker"
import Grid2 from '@mui/material/Unstable_Grid2'
import { Attr } from "./ObjectEditor"
import { Menu } from "@mui/icons-material"
import { Stack } from "@mui/system"

export interface E13 {
    id: string
    property: string
    attribute?: Attr
    comment: string
}

export interface Selection {
    id: string
    refs: string[]
    attributes: E13[]
}

type DisplayMode = 'staff-notation' | 'tablature'

export const Workspace = () => {
    const [workURI, setWorkURI] = useState('')
    const [displayMode, setDispayMode] = useState<DisplayMode>('tablature')
    const [mei, setMEI] = useState('')
    const [transformedMEI, setTransformedMEI] = useState('')
    const [selections, setSelections] = useState<Selection[]>([])
    const [activeSelectionId, setActiveSelectionId] = useState('')
    const [workPickerOpen, setWorkPickerOpen] = useState(true)

    useEffect(() => {
        if (!mei || mei.length === 0) return

        // update the staff notation MEI 
        // everytime the tablature MEI changes

        const transform = async () => {
            const resp = await fetch('tab2staff.xsl')
            const text = await resp.text()
            const xslDoc = new DOMParser().parseFromString(text, 'application/xml')
            console.log(xslDoc)

            try {
                const xsltProcessor = new XSLTProcessor()
                xsltProcessor.importStylesheet(xslDoc)
                const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')
                const result = xsltProcessor.transformToDocument(meiDoc)
                const serialized = new XMLSerializer().serializeToString(result)
                console.log('serialized=', serialized)
                setTransformedMEI(serialized)
            } catch (e) {
                console.log(e)
            }
        }

        transform()
    }, [mei])

    const saveToPod = () => {
        // create Work entity, upload MEI document, 
        // somehow connect all the Attribute Assignments
    }

    const startNewSelection = (ref: string) => {
        const id = v4()
        setSelections(selections => [...selections, {
            id,
            refs: [ref],
            attributes: []
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
        <div>
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
                startNewSelection={startNewSelection} />

            <Grid2 container spacing={2}>
                <Grid2 xs={4}>
                    <SelectionList
                        selections={selections}
                        setSelections={setSelections}
                        activeSelection={activeSelectionId}
                        setActiveSelection={setActiveSelectionId} />
                </Grid2>

                <Grid2 xs={8}>
                    <SelectionEditor
                        workURI={workURI}
                        setSelection={setSelection}
                        selection={selections.find(selection => selection.id === activeSelectionId)} />
                </Grid2>
            </Grid2>

            {/*selections.map(selection => {
                return (
                    <SelectionOverlay
                        key={selection.id}
                        selection={selection}
                        setActiveSelection={setActiveSelectionId}
                        removeSelection={removeSelectionById} />
                )
            })*/}
        </div>
    )
}