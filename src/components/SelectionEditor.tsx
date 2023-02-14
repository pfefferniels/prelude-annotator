import { Add, Delete, Edit, Save } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
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

interface SelectionEditorProps {
    selection: Selection | undefined
    setSelection: (selection: Selection) => void
}

export const SelectionEditor = ({ selection, setSelection }: SelectionEditorProps) => {
    const { highlightSelection } = useContext(SelectionContext)
    const { solidDataset: dataset } = useContext(DatasetContext)
    const { session } = useSession()

    useEffect(() => {
        selection && highlightSelection(selection.url)
    }, [selection])

    if (!selection) {
        return <div>no selection specified</div>
    }

    const isPersonalSelection = dataset !== undefined /*&& selection.provenience === getSourceUrl(dataset)*/

    return (
        <>
            <Paper sx={{
                paddingLeft: '1rem',
                paddingRight: '1rem'
            }}>
                <h3 style={{ marginBottom: '0' }}>Selection {urlAsLabel(selection.url)}</h3>

                <Stack spacing={1}>
                    <Accordion elevation={1}>
                        <AccordionSummary>affects {selection.refs.length} notes</AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {selection.refs.map(ref => {
                                    return (
                                        <ListItem
                                            secondaryAction={
                                                session.info.isLoggedIn && isPersonalSelection && (
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
            </Paper >
        </>
    )
}

