import { asUrl, buildThing, createThing, getSolidDataset, getStringNoLocale, getThing, getThingAll, getUrl, saveSolidDatasetAt, setThing, SolidDataset, Thing } from "@inrupt/solid-client"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { DCTERMS, OWL, RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Button, DialogActions, DialogContent, Drawer, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { useEffect, useState } from "react"
import { crm, dcterms } from "./namespaces"
import { E13 } from "./Workspace"

type LabeledURI = {
    uri: string,
    label: string
}

type Property = LabeledURI & {
    domain: string
    range: string
}

class Ontology {
    private things: Thing[]
    url: string
    name: string

    constructor(ontology: SolidDataset, name: string) {
        this.things = getThingAll(ontology)
        this.name = name
        const owlOntology = this.things.find(thing => getUrl(thing, RDF.type) === OWL.Ontology)
        if (!owlOntology) this.url = ''
        else this.url = asUrl(owlOntology)
    }

    title() {
        const owlOntology = this.things.find(thing => getUrl(thing, RDF.type) === OWL.Ontology)
        if (!owlOntology) return this.name
        return getStringNoLocale(owlOntology, DCTERMS.title) || this.name
    }

    allClasses() {
        return this.things
            .filter(thing =>
                getUrl(thing, RDF.type) === OWL.Class)
            .map(thing => ({
                uri: asUrl(thing),
                label: getStringNoLocale(thing, RDFS.label)
            }) as LabeledURI)
    }

    propertiesWithDomain(url: string) {
        console.log('looking for', url, 'in')
        console.log(this.things.filter(thing =>
                getUrl(thing, RDF.type) === OWL.ObjectProperty).map(thing => getUrl(thing, RDFS.domain)))

        return this.things
            .filter(thing =>
                getUrl(thing, RDF.type) === OWL.ObjectProperty &&
                getUrl(thing, RDFS.domain) === url)
            .map(thing => ({
                uri: asUrl(thing),
                label: getStringNoLocale(thing, RDFS.label)
            }) as LabeledURI)
    }

    rangeOfProperty(propertyUrl: string): string | null {
        const obj = this.things.find(thing => asUrl(thing) === propertyUrl)
        if (!obj) return null
        return getUrl(obj, RDFS.range)
    }
}

interface E13EditorProps {
    selectionURI: string
    e13: E13
    setE13: (e13: E13) => void

    assignedClasses: string[]
    setAssignedClasses: (classes: string[]) => void

    selectionList: string[]
    highlightSelection: (id: string) => void
}

const availableTreatises = [
    {
        url: '/nivers1667.ttl',
        name: 'nivers1667',
        label: 'Nivers, Traité de la composition, Paris 1667'
    },
    {
        url: '/millet1666.ttl',
        name: 'millet1666',
        label: 'Millet, L\'art de Bien Chanter, Besançon 1666'
    },
]

export const E13Editor = ({
    selectionURI,
    e13,
    setE13,
    assignedClasses,
    setAssignedClasses,
    selectionList,
    highlightSelection
}: E13EditorProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [currentTreatise, setCurrentTreatise] = useState<Ontology>()
    const [property, setProperty] = useState(e13.property)
    const [expectedRange, setExpectedRange] = useState<string | null>(null)
    const [attribute, setAttribute] = useState<string>(e13.attribute)
    const [comment, setComment] = useState(e13?.comment)

    const [assignSelectionOpen, setAssignSelectionOpen] = useState(false)

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

    const saveToPod = () => {
        setAssignedClasses([...assignedClasses, attribute])

        const id = e13.id

        setE13({
            id,
            treatise: currentTreatise?.name || '',
            property,
            attribute,
            comment
        })

        const e13Thing = buildThing(createThing({
            name: id
        }))
            .addUrl(RDF.type, crm('E13_Attribute_Assignment'))
            .addStringNoLocale(RDFS.label, id)
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P14_carried_out_by'), session.info.webId || 'http://unknown')
            .addUrl(crm('P140_assigned_attribute_to'), 'https://pfefferniels.inrupt.net/preludes/works.ttl#' + selectionURI)
            .addUrl(crm('P141_assigned'), 'https://pfefferniels.inrupt.net/preludes/works.ttl#' + attribute)
            .addStringNoLocale(crm('P3_has_note'), comment)

        if (currentTreatise) {
            e13Thing.addUrl(crm('P33_used_specific_technique'), currentTreatise?.url || '')
        }

        if (property && property.length) {
            e13Thing.addUrl(crm('P177_assigned_property_of_type'), property)
        }

        if (!dataset) {
            console.warn('No dataset found to save the new work to.');
            return;
        }

        let modifiedDataset = setThing(dataset, e13Thing.build());
        // modifiedDataset = setThing(dataset, attribute);
        saveSolidDatasetAt('https://pfefferniels.inrupt.net/preludes/works.ttl', modifiedDataset, { fetch: session.fetch as any });
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

                                {assignedClasses?.length && (
                                    currentTreatise.propertiesWithDomain(assignedClasses[0]).map(property => {
                                        return (
                                            <MenuItem
                                                key={`property_${property.uri}`}
                                                value={property.uri}>
                                                {property.label}
                                            </MenuItem>
                                        )
                                    })
                                )}
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
                <Button variant='contained' onClick={() => {
                    saveToPod()
                }}>Save</Button>
            </DialogActions>
        </Paper>
    )
}
