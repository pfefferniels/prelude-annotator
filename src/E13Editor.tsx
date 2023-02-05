import { buildThing, createThing, saveSolidDatasetAt, setThing } from "@inrupt/solid-client"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Select, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { crm, dcterms } from "./namespaces"
import { Attr, ObjectEditor } from "./ObjectEditor"
import { E13 } from "./Workspace"

interface E13EditorProps {
    selectionURI: string
    e13?: E13
    setE13: (e13: E13) => void

    open: boolean
    onClose: () => void
}

const treatises = [{
    uri: 'http://raw.github.com/nivers.ttl',
    name: 'nivers1667',
    label: 'Nivers, Traité de la composition, Paris 1667'
}]

const properties = [{
    uri: 'http://example.org/hasCadence',
    name: 'hasCadence',
    label: 'has cadence'
}, {
    uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    name: 'rdfType',
    label: 'is a'
}]

export const E13Editor = ({ selectionURI, e13, setE13, open, onClose }: E13EditorProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [treatise, setTreatise] = useState('nivers1667')
    const [property, setProperty] = useState(e13?.property || 'hasCadence')
    const [attribute, setAttribute] = useState<Attr | undefined>(e13?.attribute)
    const [comment, setComment] = useState(e13?.comment || '')

    useEffect(() => {
        if (!open) return
        setProperty(e13?.property || 'hasCadence')
        setAttribute(e13?.attribute)
        setComment(e13?.comment || '')
    }, [e13, open])

    const saveToPod = () => {
        const id = v4()

        setE13({
            id,
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
            .addStringNoLocale(crm('P33_used_specific_technique'), treatises.find(t => t.name === treatise)?.uri || 'http://unknown')
            .addUrl(crm('P14_carried_out_by'), session.info.webId || 'http://unknown')
            .addUrl(crm('P140_assigned_attribute_to'), 'https://pfefferniels.inrupt.net/preludes/works.ttl#' + selectionURI)
            .addUrl(crm('P177_assigned_property_of_type'), properties.find(p => p.name === property)?.uri || 'http://unknown')
            .addStringNoLocale(crm('P3_has_note'), comment)
            .build();

        if (!dataset) {
            console.warn('No dataset found to save the new work to.');
            return;
        }

        const modifiedDataset = setThing(dataset, e13Thing);
        saveSolidDatasetAt('https://pfefferniels.inrupt.net/preludes/works.ttl', modifiedDataset, { fetch: session.fetch as any });
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>E13 Attribute Assignment</DialogTitle>

            <DialogContent>
                Treatise:
                <Select
                    size='small'
                    value={treatise}
                    onChange={(e) => setTreatise(e.target.value)}>
                    {treatises.map(treatise => {
                        return (
                            <MenuItem
                                key={treatise.name}
                                value={treatise.name}>
                                {treatise.label}
                            </MenuItem>
                        )
                    })}
                </Select>
                <br />

                Assigned property:
                <Select
                    size='small'
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}>
                    {properties.map(property => {
                        return (
                            <MenuItem
                                key={`property_${property.name}`}
                                value={property.name}>
                                {property.label}
                            </MenuItem>
                        )
                    })}
                </Select>

                <ObjectEditor
                    type={property === 'hasCadence' ? 'cadence' : 'figure'}
                    object={attribute}
                    setObject={setAttribute} />

                <br />Comment:
                <TextField
                    size='small'
                    value={comment} onChange={(e) => setComment(e.target.value)} />
            </DialogContent>

            <DialogActions>
                <Button variant='contained' onClick={() => {
                    saveToPod()
                    onClose()
                }}>Save</Button>
                <Button variant='outlined' onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}