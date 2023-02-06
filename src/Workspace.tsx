import { IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { SelectionEditor } from "./SelectionEditor"
import { SelectionList } from "./SelectionList"
import Verovio from "./Verovio"
import { WorkPicker } from "./WorkPicker"
import Grid2 from '@mui/material/Unstable_Grid2'
import { Menu } from "@mui/icons-material"
import { Stack } from "@mui/system"

export interface E13 {
    id: string
    property: string
    attributeId?: string
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

        type Note = { pname: string, accid?: string, oct?: number }

        const pitchToNote = (p: number, keySig: number): Note => {
            let q = (p + 120) % 12
            const pitchNames: Note[] = [
                { pname: 'c' },
                keySig <= -3 ? { pname: 'd', accid: 'f' } : { pname: 'c', accid: 's' },
                { pname: 'd' },
                keySig >= 2 ? { pname: 'd', accid: 's'} : { pname: 'e', accid: 'f' },
                { pname: 'e' },
                { pname: 'f' },
                { pname: 'f', accid: 's' },
                { pname: 'g' },
                keySig <= -2 ? { pname: 'a', accid: 'f' } : { pname: 'g', accid: 's' },
                { pname: 'a' },
                { pname: 'b', accid: 'f' },
                { pname: 'b' }]
            const result = pitchNames[q]
            result.oct = Math.trunc(p / 12 - 1)
            return result
        }

        const baroqueDMinorTuning = [ 65, 62, 57, 53, 50, 45, 43, 41, 40, 38, 36 ]

        console.log('mei=', mei)

        // update the staff notation MEI 
        // everytime the tablature MEI changes
        const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')

        const staffDef = meiDoc.querySelector('staffDef')
        if (staffDef) {
            staffDef.setAttribute('meter.count', '1')
            staffDef.setAttribute('meter.unit', '8')
            staffDef.setAttribute('clef.line', '4')
            staffDef.setAttribute('clef.shape', 'F')
            staffDef.removeAttribute('notationtype')
            staffDef.setAttribute('lines', '5')
            const tuning = staffDef.querySelector('tuning')
            tuning && staffDef.removeChild(tuning)
        }

        meiDoc.querySelectorAll('note').forEach(note => {
            const course = note.getAttribute('tab.course')
            const fret = note.getAttribute('tab.fret')
            if (!course || !fret) {
                console.log('no @tab.course or @tab.fret attribute found')
                return
            }
            const pitch = baroqueDMinorTuning[+course - 1] + (+fret)
            const newNote = pitchToNote(pitch, -1)
            note.setAttribute('pname', newNote.pname)
            newNote.accid && note.setAttribute('accid', newNote.accid)
            newNote.oct && note.setAttribute('oct', newNote.oct.toString())
            note.removeAttribute('tab.course')
            note.removeAttribute('tab.fret')
        })
        const transformed = new XMLSerializer().serializeToString(meiDoc).replaceAll('tabGrp', 'chord')
        console.log(transformed)
        setTransformedMEI(transformed)
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
        <div style={{margin: '1rem'}}>
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