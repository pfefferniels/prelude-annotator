import { buildThing, createThing, getPropertyAll, getSolidDataset, getSourceUrl, getThing, hasResourceInfo, saveSolidDatasetAt, setThing } from "@inrupt/solid-client"
import { DatasetContext, useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Save } from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { Button, DialogActions, Drawer, FormControl, FormLabel, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import availableTreatises from "./availableTreatises.json"
import { crm, crminf, dcterms } from "../helpers/namespaces"
import { Ontology } from "../helpers/Ontology"
import { E13 } from "./Workspace"
import { SelectionContext } from "../context/SelectionContext"

interface E13EditorProps {
    selectionId: string
    e13: E13
    availableDomains: string[]
    onClose: () => void
}

export const E13Editor = ({
    selectionId,
    e13,
    availableDomains,
    onClose
}: E13EditorProps) => {
    const { availableSelections, highlightSelection } = useContext(SelectionContext)
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
        if (!currentTreatise || !availableDomains.length) return

        console.log(currentTreatise.propertiesWithDomain(availableDomains[0]))
    }, [currentTreatise, availableDomains])

    const saveToPod = async () => {
        const id = e13.id

        if (!dataset || !hasResourceInfo(dataset)) return

        const sourceUrl = getSourceUrl(dataset)

        const e13Thing = buildThing(createThing({
            name: id
        }))
            .addUrl(RDF.type, crm('E13_Attribute_Assignment'))
            .addUrl(RDF.type, crminf('I4_Information_Set'))
            .addStringNoLocale(RDFS.label, id)
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P14_carried_out_by'), session.info.webId!)
            .addUrl(crm('P140_assigned_attribute_to'), `${sourceUrl}#${selectionId}`)
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
        onClose()
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

                                {availableDomains
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
                                        {availableSelections.map((selectionId => {
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

                <FormControl>
                    <FormLabel>Hold this proposition to be …</FormLabel>
                    <Select size='small'>
                        <MenuItem>likely</MenuItem>
                        <MenuItem>unlikely/questionable</MenuItem>
                        <MenuItem>false</MenuItem>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>And argue that …</FormLabel>
                    <TextField size='small' placeholder="Proposition ..." />
                </FormControl>

                <FormControl>
                    <FormLabel>is</FormLabel>
                    <Select size='small'>
                        <MenuItem>likely</MenuItem>
                        <MenuItem>unlikely/questionable</MenuItem>
                        <MenuItem>false</MenuItem>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>based on</FormLabel>
                    <Select size='small'>
                        <MenuItem>Belief Adoption</MenuItem>
                        <MenuItem>Method or Reasoning</MenuItem>
                    </Select>
                </FormControl>

                <TextField label="Textual description of adopted belief or the applied method" />
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
        </Paper >
    )
}
