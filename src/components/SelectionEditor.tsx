import { Add, Cancel, ChevronLeft, ChevronRight, Close, Delete, Edit, Save } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, DialogTitle, Divider, IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { useContext, useEffect, useState } from "react"
import { Selection, isSelection, Reference } from "../types/Selection"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { buildThing, createThing, setThing, saveSolidDatasetAt, getSourceUrl } from "@inrupt/solid-client"
import { RDF } from "@inrupt/vocab-common-rdf"
import { crm, dcterms } from "../helpers/namespaces"
import { Stack } from "@mui/system"
import { v4 } from "uuid"
import { E13List } from "./E13List"
import { SelectionContext } from "../context/SelectionContext"
import { LoadingButton } from "@mui/lab"
import { urlAsLabel } from "./E13Summary"
import { AnalysisContext } from "../context/AnalysisContext"

interface SelectionEditorProps {
    selection: Selection | undefined
    setSelection: (selection: Selection | undefined) => void
}

export const SelectionEditor = ({ selection, setSelection }: SelectionEditorProps) => {
    const { editable } = useContext(AnalysisContext)
    const { highlightSelection } = useContext(SelectionContext)

    useEffect(() => {
        selection && highlightSelection(selection.url)
    }, [selection])

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

