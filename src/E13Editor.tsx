import { Check } from "@mui/icons-material"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Select, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { Attr, ObjectEditor } from "./ObjectEditor"
import { E13, Selection } from "./Workspace"

interface E13EditorProps {
    e13?: E13
    setE13: (e13: E13) => void

    open: boolean
    onClose: () => void
}

const treatises = [{
    uri: '...',
    name: 'nivers1667',
    label: 'Nivers, Traité de la composition, Paris 1667'
}]

const properties = [{
    uri: 'example.org/hasCadence',
    name: 'hasCadence',
    label: 'has cadence'
}, {
    uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    name: 'rdfType',
    label: 'is a'
}]

export const E13Editor = ({ e13, setE13, open, onClose }: E13EditorProps) => {
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
        setE13({
            id: v4(),
            property,
            attribute,
            comment
        })
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add E13 Attribute Assignment</DialogTitle>

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