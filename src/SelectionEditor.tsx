import { Add, Delete, Edit, Save } from "@mui/icons-material"
import { IconButton, List, ListItem, ListItemText, Paper, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { E13Editor } from "./E13Editor"
import { E13, isSelection, Selection } from "./Workspace"
import Grid2 from '@mui/material/Unstable_Grid2'
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { buildThing, createThing, setThing, saveSolidDatasetAt, thingAsMarkdown, getPropertyAll, getUrl, removeThing, getSourceUrl } from "@inrupt/solid-client"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { crm, dcterms } from "./namespaces"
import { Stack } from "@mui/system"
import { E13Summary } from "./E13Summary"
import { v4 } from "uuid"

interface SelectionEditorProps {
    workURI: string
    selection: Selection | undefined
    setSelection: (selection: Selection) => void

    selectionList: string[]
    highlightSelection: (selectionId: string) => void
}

export const SelectionEditor = ({
    workURI,
    selection,
    setSelection,
    selectionList,
    highlightSelection }: SelectionEditorProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [selectedE13, setSelectedE13] = useState<string>()
    const [currentClasses, setCurrentClasses] = useState<string[]>([])

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

    useEffect(() => {
        setSelectedE13(undefined)
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

        // TODO move E13 Builder here

        const modifiedDataset = setThing(dataset, selectionThing.build());
        saveSolidDatasetAt(getSourceUrl(dataset)!, modifiedDataset, { fetch: session.fetch as any });
    }

    useEffect(saveToPod, [selection])

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
                    setSelectedE13(id)
                }}>
                    <Add />
                </IconButton>

                <Grid2 container spacing={1}>
                    <Grid2 xs={4}>
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
                    </Grid2>
                    <Grid2 xs={2}>
                        <Stack spacing={1} direction='row'>
                            {selection.e13s.map((e13, i) => {
                                return (
                                    <Paper key={`selection_editor_${e13.id}`}>
                                        <IconButton onClick={() => {
                                            setSelectedE13(e13.id)
                                            // setE13Open(true)
                                        }}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton onClick={() => {
                                            if (dataset) {
                                                const sourceUrl = getSourceUrl(dataset)
                                                if (sourceUrl) {
                                                    const modifiedDataset = removeThing(dataset, sourceUrl + e13.id)
                                                    saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
                                                }
                                            }

                                            selection.e13s.splice(i, 1)
                                            setSelection({
                                                id: selection.id,
                                                refs: selection.refs,
                                                e13s: selection.e13s
                                            })
                                            const index = currentClasses.findIndex(className =>
                                                e13.attribute === className
                                            )
                                            if (index != -1) {
                                                const newClasses = currentClasses.slice()
                                                currentClasses.splice(index, 1)
                                                setCurrentClasses(newClasses)
                                            }
                                        }}>
                                            <Delete />
                                        </IconButton>

                                        {selectedE13 === e13.id ?
                                            <E13Editor
                                                assignedClasses={currentClasses}
                                                setAssignedClasses={setCurrentClasses}
                                                selectionURI={selection.id}
                                                e13={e13}
                                                setE13={(e13) => {
                                                    const newAttributes = selection.e13s.slice()
                                                    const index = newAttributes.findIndex(attr => attr.id === selectedE13)
                                                    if (index === -1) {
                                                        console.log('This is not supposed to happen.', selection.id, 'is unknown.')
                                                        return
                                                    }

                                                    newAttributes[index] = e13
                                                    setSelection({
                                                        id: selection.id,
                                                        refs: selection.refs,
                                                        e13s: newAttributes
                                                    })
                                                }}
                                                selectionList={selectionList}
                                                highlightSelection={highlightSelection}
                                            />
                                            :
                                            <E13Summary e13={e13} />
                                        }
                                    </Paper>
                                )
                            })}
                        </Stack>
                    </Grid2>
                </Grid2>
            </Paper >
        </>
    )
}
