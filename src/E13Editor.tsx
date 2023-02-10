import { buildThing, createThing, getPropertyAll, getSolidDataset, getSourceUrl, getThing, hasResourceInfo, saveSolidDatasetAt, setThing } from "@inrupt/solid-client"
import { DatasetContext, useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Save } from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { Button, DialogActions, DialogContent, Drawer, FormControl, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import availableTreatises from "./availableTreatises.json"
import { crm, dcterms } from "./namespaces"
import { Ontology } from "./Ontology"
import { E13 } from "./Workspace"

interface E13EditorProps {
    selectionURI: string
    e13: E13
    setE13: (e13: E13) => void

    assignedClasses: string[]
    setAssignedClasses: (classes: string[]) => void

    selectionList: string[]
    highlightSelection: (id: string) => void
}

export const E13Editor = ({
    selectionURI,
    e13,
    setE13,
    assignedClasses,
    setAssignedClasses,
    selectionList,
    highlightSelection
}: E13EditorProps) => {
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext)
    const { session } = useSession()

    const [currentTreatise, setCurrentTreatise] = useState<Ontology>()
    const [property, setProperty] = useState(e13.property)
    const [expectedRange, setExpectedRange] = useState<string | null>(null)
    const [attribute, setAttribute] = useState<string>(e13.attribute)
    const [comment, setComment] = useState(e13?.comment)

    const [assignSelectionOpen, setAssignSelectionOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!e13) return

        setProperty(e13.property)
        setAttribute(e13.attribute)
        setComment(e13.comment)

        const loadTreatise = async (url: string) => {
            setCurrentTreatise(new Ontology(await getSolidDataset(url), e13.treatise))
        }

        const selectedTreatise = availableTreatises.find(t => t.name === e13.treatise)
        if (selectedTreatise) loadTreatise(selectedTreatise.url)
    }, [e13])

    useEffect(() => {
        if (!currentTreatise || !assignedClasses.length) return

        console.log(currentTreatise.propertiesWithDomain(assignedClasses[0]))
    }, [currentTreatise, assignedClasses])

    const saveToPod = async () => {
        setAssignedClasses([...assignedClasses, attribute])

        const id = e13.id

        setE13({
            id,
            treatise: currentTreatise?.name || '',
            property,
            attribute,
            comment
        })

        if (!dataset || !hasResourceInfo(dataset)) return

        const sourceUrl = getSourceUrl(dataset)

        console.log('test=', `${sourceUrl}#${attribute}`)

        const e13Thing = buildThing(createThing({
            name: id
        }))
            .addUrl(RDF.type, crm('E13_Attribute_Assignment'))
            .addStringNoLocale(RDFS.label, id)
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P14_carried_out_by'), session.info.webId!)
            .addUrl(crm('P140_assigned_attribute_to'), `${sourceUrl}#${selectionURI}`)
            .addUrl(crm('P141_assigned'), attribute.startsWith('http') ? attribute : `${sourceUrl}/#${attribute}`)
            .addStringNoLocale(crm('P3_has_note'), comment)

        if (currentTreatise) {
            e13Thing.addUrl(crm('P33_used_specific_technique'), currentTreatise?.url || '')
        }

        if (property && property.length) {
            e13Thing.addUrl(crm('P177_assigned_property_of_type'), property)
        }

        const modifiedDataset = setThing(dataset, e13Thing.build());

        setSaving(true)
        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
        setSaving(false)
    }

    return (
        <Paper style={{ minWidth: '200px' }}>
            <Stack spacing={2}>
                <FormControl variant='standard'>
                    <InputLabel>Treatise</InputLabel>

                    <Select
                        size='small'
                        value={currentTreatise?.name || ''}
                        onChange={async (e) => {
                            const name = e.target.value
                            const treatise = availableTreatises.find(treatise =>
                                treatise.name === name)!
                            const dataset = await getSolidDataset(treatise.url)
                            if (!dataset) return
                            setCurrentTreatise(new Ontology(dataset, name))
                        }}>
                        {availableTreatises.map(treatise => {
                            return (
                                <MenuItem
                                    key={treatise.name}
                                    value={treatise.name}>
                                    {treatise.label}
                                </MenuItem>
                            )
                        })}
                    </Select>
                </FormControl>

                {currentTreatise && (
                    <>
                        <FormControl variant='standard'>
                            <InputLabel>Assigned Property</InputLabel>
                            <Select
                                size='small'
                                value={property}
                                onChange={(e) => {
                                    setProperty(e.target.value)
                                    setExpectedRange(currentTreatise.rangeOfProperty(e.target.value))
                                }}>
                                <MenuItem value={RDF.type}>is a</MenuItem>

                                {assignedClasses
                                    .map(assignedClass => currentTreatise.propertiesWithDomain(assignedClass))
                                    .flat()
                                    .filter((item, i, arr) => {
                                        // filter out duplicates
                                        return arr.findIndex(other => other.uri === item.uri) === i
                                    })
                                    .map(property => {
                                        return (
                                            <MenuItem
                                                key={`property_${property.uri}`}
                                                value={property.uri}>
                                                {property.label}
                                            </MenuItem>
                                        )
                                    })
                                }
                            </Select>
                        </FormControl>

                        {property === RDF.type ? (
                            <FormControl variant='standard'>
                                <InputLabel>Assigned Object</InputLabel>

                                <Select
                                    size='small'
                                    value={attribute}
                                    onChange={(e) => setAttribute(e.target.value)}>
                                    {currentTreatise.allClasses().map(classObj => {
                                        return (
                                            <MenuItem
                                                key={`class_${classObj.uri}`}
                                                value={classObj.uri}>
                                                {classObj.label}
                                            </MenuItem>
                                        )
                                    })}
                                </Select>
                            </FormControl>
                        ) :
                            <>
                                <small>expects {expectedRange || 'anything'}</small>

                                <Button onClick={() => setAssignSelectionOpen(true)}>Assign Selection</Button>
                                <div>{attribute}</div>
                                <Drawer open={assignSelectionOpen}>
                                    <List dense>
                                        {selectionList.map((selectionId => {
                                            return (
                                                <ListItem
                                                    onClick={() => {
                                                        setAttribute(selectionId)
                                                        setAssignSelectionOpen(false)
                                                    }}
                                                    onMouseOver={() => highlightSelection(selectionId)}
                                                    key={`selection_picker_${selectionId}`}>
                                                    <ListItemText primary={selectionId} />
                                                </ListItem>
                                            )
                                        }))}
                                    </List>
                                </Drawer>
                            </>
                        }
                    </>
                )}


                <TextField
                    label='Comment'
                    placeholder='Comment'
                    size='small'
                    value={comment}
                    onChange={(e) => setComment(e.target.value)} />
            </Stack>

            <DialogActions>
                <LoadingButton
                    startIcon={<Save />}
                    loading={saving}
                    variant='contained'
                    onClick={saveToPod}>
                    Save
                </LoadingButton>
            </DialogActions>
        </Paper>
    )
}
