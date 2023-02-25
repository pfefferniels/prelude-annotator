import { Delete } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, IconButton, List, ListItem, ListItemText, Typography } from "@mui/material"
import { useContext, useEffect } from "react"
import { Selection, isSelection } from "../../types/Selection"
import { Stack } from "@mui/system"
import { E13List } from "../e13"
import { SelectionContext } from "../../context/SelectionContext"
import { urlAsLabel } from "../../helpers/urlAsLabel"
import { AnalysisContext } from "../../context/AnalysisContext"

interface SelectionEditorProps {
    selection: Selection | undefined
    setSelection: (selection: Selection | undefined) => void
}

export const SelectionEditor = ({ selection, setSelection }: SelectionEditorProps) => {
    const { editable } = useContext(AnalysisContext)

    if (!selection) {
        return <div>no selection specified</div>
    }

    return (
        <>
            <Typography>Selection: <span style={{ color: 'gray' }}>{urlAsLabel(selection.url)}</span></Typography>


            <Stack spacing={1}>
                <Accordion elevation={1}>
                    <AccordionSummary>affects {selection.refs.length} notes</AccordionSummary>
                    <AccordionDetails>
                        <List dense>
                            {selection.refs.map(ref => {
                                return (
                                    <ListItem
                                        secondaryAction={
                                            editable && (
                                                <IconButton onClick={() => {
                                                    const refs = selection.refs
                                                    refs.splice(refs.findIndex(r => r === ref), 1)
                                                    setSelection({
                                                        url: selection.url,
                                                        refs: selection.refs
                                                    })
                                                }}>
                                                    <Delete />
                                                </IconButton>
                                            )
                                        }
                                        key={`selection_editor_${ref}`}>
                                        <ListItemText primary={isSelection(ref) ? ref.url : ref} />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </AccordionDetails>
                </Accordion>

                <Typography>Attributes</Typography>
                <E13List forSelection={selection} />
            </Stack>
        </>
    )
}

