import { Add, Delete, Edit, Save } from "@mui/icons-material"
import { IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { useContext, useEffect } from "react"
import { Selection, isSelection } from "../types/Selection"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { buildThing, createThing, setThing, saveSolidDatasetAt, getSourceUrl } from "@inrupt/solid-client"
import { RDF } from "@inrupt/vocab-common-rdf"
import { crm, dcterms } from "../helpers/namespaces"
import { Stack } from "@mui/system"
import { v4 } from "uuid"
import { E13List } from "./E13List"
import { SelectionContext } from "../context/SelectionContext"

interface SelectionEditorProps {
    workURI: string
    selection: Selection | undefined
    setSelection: (selection: Selection) => void
}

export const SelectionEditor = ({
    workURI,
    selection,
    setSelection }: SelectionEditorProps) => {
    const { highlightSelection } = useContext(SelectionContext)
    const { solidDataset: dataset } = useContext(DatasetContext)
    const { session } = useSession()

    useEffect(() => {
        selection && highlightSelection(selection.id)
    }, [selection])

    const saveToPod = () => {
        if (!selection) return

        if (!dataset) {
            console.warn('No dataset found to save the new work to.')
            return
        }

        // saves the given selection in the POD
        const selectionThing = buildThing(createThing({
            name: selection.id
        }))
            .addUrl(RDF.type, crm('E90_Symbolic_Object'))
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P106i_forms_part_of'), workURI)

        selection.refs.forEach(ref => {
            selectionThing.addUrl(crm('P106_is_composed_of'), `${workURI}#${ref}`)
        })

        const modifiedDataset = setThing(dataset, selectionThing.build());
        saveSolidDatasetAt(getSourceUrl(dataset)!, modifiedDataset, { fetch: session.fetch as any });
    }

    if (!selection) {
        return <div>no selection specified</div>
    }

    const isPersonalSelection = dataset && selection.provenience === getSourceUrl(dataset)

    return (
        <>
            <Paper sx={{
                paddingLeft: '1rem'
            }}>
                <h3 style={{ marginBottom: '0' }}>Selection {selection.id}</h3>
                <div>
                    <small>affects {selection.refs.length} elements</small>
                </div>

                <IconButton onClick={saveToPod}>
                    <Save />
                </IconButton>

                <Stack spacing={1}>
                    <Paper>
                        <Typography>Affects the following notes</Typography>
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
                                                        id: selection.id,
                                                        provenience: selection.provenience,
                                                        refs: selection.refs
                                                    })
                                                }}>
                                                    <Delete />
                                                </IconButton>
                                            )
                                        }
                                        key={`selection_editor_${ref}`}>
                                        <ListItemText primary={isSelection(ref) ? ref.id : ref} />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Paper>
                    <E13List
                        forSelection={selection} />
                </Stack>
            </Paper >
        </>
    )
}

