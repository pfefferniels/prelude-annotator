import { Button } from "@mui/material"
import { useState } from "react"
import { v4 } from "uuid"
import { SelectionEditor } from "./SelectionEditor"
import { SelectionList } from "./SelectionList"
import Verovio from "./Verovio"
import { WorkPicker } from "./WorkPicker"
import Grid2 from '@mui/material/Unstable_Grid2'
import { Attr } from "./ObjectEditor"

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

export const Workspace = () => {
    const [workURI, setWorkURI] = useState('')
    const [mei, setMEI] = useState('')
    const [selections, setSelections] = useState<Selection[]>([])
    const [activeSelectionId, setActiveSelectionId] = useState('')
    const [workPickerOpen, setWorkPickerOpen] = useState(true)

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
            <Button onClick={() => setWorkPickerOpen(true)}>
                Open Work
            </Button>

            <Verovio
                mei={mei}
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