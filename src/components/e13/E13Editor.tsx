import { UrlString } from "@inrupt/solid-client"
import { RDF } from "@inrupt/vocab-common-rdf"
import { Delete, Save } from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { Button, DialogActions, FormControl, InputLabel, MenuItem, Paper, Select } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { Ontology } from "../../helpers/Ontology"
import { E13 } from "../../types/E13"
import { Argumentation } from "../../types/Belief"
import { Selection } from "../../types/Selection"
import { AnalysisContext } from "../../context/AnalysisContext"
import { SelectionPicker } from "../selection"

interface E13EditorProps {
    selectionUrl: string
    e13: E13
    availableDomains: string[]
    onClose: () => void
    saving: boolean
    saveE13: (e13: E13) => void
    removeE13: (e13: E13) => void
}

export const E13Editor = ({
    e13,
    availableDomains,
    onClose,
    saving,
    saveE13,
    removeE13
}: E13EditorProps) => {
    const { availableArgumentations, availableOntologies, editable } = useContext(AnalysisContext)

    const [referredArgumentations, setReferredArgumentations] = useState<Argumentation[]>()

    const [currentTreatise, setCurrentTreatise] = useState<Ontology>()
    const [property, setProperty] = useState(e13.property)
    const [expectedRange, setExpectedRange] = useState<string | null>(null)
    const [attribute, setAttribute] = useState<Selection | UrlString>(e13.attribute)
    const [comment, setComment] = useState(e13?.comment)

    const [assignSelectionOpen, setAssignSelectionOpen] = useState(false)

    console.log('available argumentations', availableArgumentations)

    useEffect(() => {
        if (!e13) return

        setProperty(e13.property)
        setAttribute(e13.attribute)
        setComment(e13.comment)
        setCurrentTreatise(availableOntologies.find(ontology => ontology.url === e13.treatise))
    }, [e13])

    useEffect(() => {
        if (!currentTreatise || !availableDomains.length) return

        console.log(currentTreatise.propertiesWithDomain(availableDomains[0]))
    }, [currentTreatise, availableDomains])

    useEffect(() => {
        // Finds the argumentations which refer to the given E13
        setReferredArgumentations(
            availableArgumentations
                .filter(argumentation => {
                    // TODO: on the long term premises would have to
                    // be considered as well, not only conclusions
                    const referredBelief = argumentation.concluded.find(belief => {
                        // console.log('belief that', belief.that, '===', e13.id, '?')
                        return belief.that === e13.url.split('#').at(-1)
                    })
                    return referredBelief !== undefined
                })
        )
    }, [availableArgumentations])

    return (
        <Paper style={{ minWidth: '200px', maxWidth: '350px', padding: '0.5rem' }}>
            <Stack spacing={2}>
                <FormControl variant='standard'>
                    <InputLabel>According to …</InputLabel>

                    <Select
                        disabled={!editable}
                        size='small'
                        value={currentTreatise?.name || ''}
                        onChange={async (e) => {
                            setCurrentTreatise(availableOntologies.find(ontology => ontology.name === e.target.value))
                        }}>
                        {availableOntologies.map(ontology => {
                            return (
                                <MenuItem
                                    key={ontology.name}
                                    value={ontology.name}>
                                    {ontology.label}
                                </MenuItem>
                            )
                        })}
                    </Select>
                </FormControl>

                {currentTreatise && (
                    <>
                        <Stack direction='row'>
                            <FormControl variant='standard'>
                                <InputLabel>the selection …</InputLabel>
                                <Select
                                    disabled={!editable}
                                    style={{ minWidth: '200px' }}
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
                                        disabled={!editable}
                                        sx={{ minWidth: 200 }}
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
                                <Stack>
                                    {editable && <Button onClick={() => setAssignSelectionOpen(true)}>assign {expectedRange?.split('/').at(-1) || 'selection'}</Button>}
                                    <div>{typeof attribute === "string" ? attribute : attribute.url.split('#').at(-1)}</div>

                                    <SelectionPicker
                                        setAttribute={setAttribute}
                                        open={assignSelectionOpen}
                                        onClose={() => setAssignSelectionOpen(false)} />
                                </Stack>
                            }
                        </Stack>
                    </>
                )}
            </Stack>

            <DialogActions>
                <LoadingButton
                    disabled={!editable}
                    color='secondary'
                    variant='outlined'
                    onClick={() => removeE13(e13)}>
                    <Delete />
                </LoadingButton>

                <LoadingButton
                    disabled={!editable}
                    startIcon={<Save />}
                    loading={saving}
                    variant='contained'
                    onClick={async () => {
                        await saveE13({
                            // The URL remains the same
                            url: e13.url,

                            // all other properties have been changed
                            // and are read from the respective states
                            property,
                            attribute,
                            treatise: currentTreatise?.url || '',
                            comment,

                            // the target will be ignored by the saveE13 
                            // routine and replaced by the current selection
                            target: ''
                        })
                        onClose()
                    }}>
                    Save
                </LoadingButton>
            </DialogActions>
        </Paper >
    )
}



