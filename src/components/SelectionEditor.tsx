import { Add, Delete, Edit, Save } from "@mui/icons-material"
import { IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { useContext, useEffect } from "react"
import { isSelection, Selection } from "./Workspace"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
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
    const { dataset } = useDataset()
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

    // useEffect(saveToPod, [selection])

    if (!selection) {
        return <div>no selection specified</div>
    }

    return (
        <>
            <Paper sx={{
                paddingLeft: '1rem'
            }}>
                <h3 style={{ marginBottom: '0' }}>Selection {selection.id}</h3>
                <div>
                    <small>affects {selection.refs.length} elements, has {selection.e13s.length} attribute assignments</small>
                </div>

                <IconButton onClick={saveToPod}>
                    <Save />
                </IconButton>

                <IconButton onClick={() => {
                    const id = v4()
                    setSelection({
                        id: selection.id,
                        refs: selection.refs,

                        // append a new E13
                        e13s: [...selection.e13s, {
                            id,
                            treatise: '',
                            property: '',
                            attribute: '',
                            comment: ''
                        }]
                    })
                }}>
                    <Add />
                </IconButton>

                <Stack spacing={1}>
                    <Paper>
                        <Typography>Affects the following MEI elements</Typography>
                        <List dense>
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
                                                    e13s: selection.e13s
                                                })
                                            }}>
                                                <Delete />
                                            </IconButton>
                                        }
                                        key={`selection_editor_${ref}`}>
                                        <ListItemText primary={isSelection(ref) ? ref.id : ref} />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Paper>
                    <E13List
                        e13s={selection.e13s}
                        selectionId={selection.id}/>
                </Stack>
            </Paper >
        </>
    )
}

