import { asUrl, buildThing, createThing, getPropertyAll, getSolidDataset, getStringNoLocale, getThing, getThingAll, getUrl, getUrlAll, removeAll, saveSolidDatasetAt, setThing, Thing, thingAsMarkdown } from "@inrupt/solid-client"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { updateDataset } from "@inrupt/solid-ui-react/dist/src/helpers"
import { OWL, RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Save } from "@mui/icons-material"
import { Paper, FormControl, InputLabel, Select, MenuItem, IconButton } from "@mui/material"
import { Stack } from "@mui/system"
import { useEffect, useState } from "react"
import { crm } from "./namespaces"

type Class = {
    uri: string,
    label: string
}

type Property = {
    uri: string,
    label: string,
    ranges?: Class[]
}

interface ObjectEditorProps {
    ontologyUrl: string
    classUrl: string

    // the entity with the selected properties
    object: Thing
    setObject: (thing: Thing) => void
}

export const ObjectEditor = ({ ontologyUrl, classUrl, object: thing, setObject }: ObjectEditorProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [properties, setProperties] = useState<Property[]>()
    const [selectedProperties, setSelectedProperties] = useState<Map<string, string>>(new Map())

    const saveToPod = () => {
        if (!dataset) return

        // remove existing properties
        let modifiedThing = thing
        const existingProperties = getPropertyAll(modifiedThing)
        existingProperties.forEach(p => {
            modifiedThing = removeAll(modifiedThing, p)
        })

        // add all the new properties
        const thingBuilder = buildThing(modifiedThing)
        //    .addUrl(RDF.type, crm('E28_Conceptual_Object'))
        selectedProperties.forEach((o, p) => thingBuilder.addUrl(p, o))

        const newThing = thingBuilder.build()
        setObject(newThing)

        const modifiedDataset = setThing(dataset, newThing)
        saveSolidDatasetAt('https://pfefferniels.inrupt.net/preludes/works.ttl', modifiedDataset, { fetch: session.fetch as any });
    }

    useEffect(() => {
        // if the ID does exist already in the dataset, construct 
        // the selected properties accordingly
        if (!dataset) return

        const properties = getPropertyAll(thing)
        properties.forEach(property => {
            const value = getUrl(thing, property)
            console.log('setting', property, 'to', value)
            value && selectedProperties.set(property, value)
        })

        setSelectedProperties(new Map(selectedProperties))
    }, [thing])

    useEffect(() => {
        if (!ontologyUrl.length) return

        // download the ontology
        const fetchOntology = async () => {
            const ontology = await getSolidDataset(ontologyUrl)
            const mainClass = getThing(ontology, classUrl)
            if (!mainClass) return

            // find subclasses
            const things = getThingAll(ontology)
            setProperties([{
                uri: RDF.type,
                label: 'Type',
                ranges: things
                    .filter(thing => getUrl(thing, RDFS.subClassOf) === asUrl(mainClass))
                    .map(subClass => {
                        return {
                            uri: asUrl(subClass),
                            label: getStringNoLocale(subClass, RDFS.label) || 'no-label'
                        }
                    })
            },
            ...things
                .filter(thing => getUrlAll(thing, RDF.type).includes(OWL.ObjectProperty))
                .map((property): Property => {
                    const range = getUrl(property, RDFS.range)

                    return {
                        uri: asUrl(property),
                        label: getStringNoLocale(property, RDFS.label) || 'no-label',
                        ranges:
                            range ? things
                                .filter(thing => getUrl(thing, RDFS.subClassOf) === range)
                                .map((subClass): Class => {
                                    return {
                                        uri: asUrl(subClass),
                                        label: getStringNoLocale(subClass, RDFS.label) || 'no-label'
                                    }
                                })
                                : undefined
                    }
                })
            ])
        }

        fetchOntology()
    }, [ontologyUrl, classUrl])

    return (
        <Paper elevation={3} sx={{ padding: '0.5rem' }}>
            <Stack spacing={2}>
                {properties?.map(property => {
                    return (
                        <FormControl
                            key={`form_${property.label}`}
                            variant='standard'>
                            <InputLabel>{property.label}</InputLabel>

                            <Select
                                label={property.label}
                                value={selectedProperties.get(property.uri) || ''}
                                onChange={(e) => {
                                    setSelectedProperties(new Map(
                                        selectedProperties.set(property.uri, e.target.value)
                                    ))
                                }}>
                                {property.ranges?.map(range => {
                                    return (
                                        <MenuItem
                                            key={`item_${range.label}`}
                                            value={range.uri}>
                                            {range.label}
                                        </MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                    )
                })}
            </Stack>

            <IconButton onClick={saveToPod}>
                <Save />
            </IconButton>
        </Paper>
    )
}
