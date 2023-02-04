import { Add, Delete, Edit, Save } from "@mui/icons-material"
import { IconButton, List, ListItem, ListItemText, Paper } from "@mui/material"
import { useEffect, useState } from "react"
import { E13Editor } from "./E13Editor"
import { E13, Selection } from "./Workspace"
import Grid2 from '@mui/material/Unstable_Grid2'

interface SelectionEditorProps {
    selection: Selection | undefined
    setSelection: (selection: Selection) => void
}

export const SelectionEditor = ({ selection, setSelection }: SelectionEditorProps) => {
    const [e13Open, setE13Open] = useState<boolean>(false)
    const [selectedE13, setSelectedE13] = useState<string>()

    useEffect(() => {
        // highlight the current selection in the score 

        const verovioHighlightStyle = document.querySelector('#verovioHighlightStyle') as Element
        if (!selection || selection.refs.length === 0) {
            verovioHighlightStyle.textContent = ''
            return
        }
        verovioHighlightStyle.textContent = selection.refs.map(ref => `[data-id='${ref}']`).join(',') + `
            {
                stroke: red;
                fill: red;
            }`
    })

    const saveToPod = () => {
        // saves the given selection in the POD

    }

    if (!selection) {
        return <div>no selection specified</div>
    }

    return (
        <>
            <Paper>
                <h3>Selection {selection.id}</h3>

                <IconButton onClick={saveToPod}>
                    <Save />
                </IconButton>

                <IconButton onClick={() => setE13Open(true)}>
                    <Add />
                </IconButton>

                <Grid2 container spacing={1}>
                    <Grid2 xs={6}>
                        Contains the following E13 Attribute Assignments
                        <List>
                            {selection.attributes.map((attribute, i) => {
                                return (
                                    <ListItem
                                        secondaryAction={
                                            <>
                                            <IconButton onClick={() => {
                                                setSelectedE13(attribute.id)
                                                setE13Open(true)
                                            }}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => {
                                                selection.attributes.splice(i, 1)
                                                setSelection({
                                                    id: selection.id,
                                                    refs: selection.refs,
                                                    attributes: selection.attributes
                                                })
                                            }}>
                                                <Delete />
                                            </IconButton>
                                            </>
                                        }
                                        key={`selection_editor_${attribute.id}`}>
                                        <ListItemText primary={attribute.property} secondary={attribute.comment} />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Grid2>
                    <Grid2 xs={4}>
                        Affects the following MEI elements:
                        <Paper>
                            <List>
                                {selection.refs.map(ref => {
                                    return (
                                        <ListItem
                                            secondaryAction={
                                                <IconButton onClick={() => {
                                                    const refs = selection.refs
                                                    refs.splice(refs.findIndex(r => r === ref), 1)
                                                    setSelection({
                                                        id: selection.id,
                                                        refs: selection.refs,
                                                        attributes: selection.attributes
                                                    })
                                                }}>
                                                    <Delete />
                                                </IconButton>
                                            }
                                            key={`selection_editor_${ref}`}>
                                            <ListItemText primary={ref} />
                                        </ListItem>
                                    )
                                })}
                            </List>
                        </Paper>
                    </Grid2>
                </Grid2>
            </Paper>

            <E13Editor
                e13={selection.attributes.find(attr => attr.id === selectedE13)}
                setE13={(e13) => {
                    console.log('updating')
                    const newAttributes = selection.attributes.slice()
                    const index = newAttributes.findIndex(attr => attr.id === selectedE13)
                    if (index === -1) {
                        newAttributes.push(e13)
                    }
                    else {
                        newAttributes[index] = e13
                    }
                    setSelection({
                        id: selection.id, 
                        refs: selection.refs,
                        attributes: newAttributes
                    })
                }}
                open={e13Open}
                onClose={() => setE13Open(false)} />
        </>
    )
}
