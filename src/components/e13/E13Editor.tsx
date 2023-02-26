import { UrlString } from "@inrupt/solid-client"
import { RDF } from "@inrupt/vocab-common-rdf"
import { AddLink, Delete, HighlightAlt, Save } from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { AccordionActions, FormControl, IconButton, InputLabel, MenuItem, Select, Tooltip } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { Ontology } from "../../helpers/Ontology"
import { E13 } from "../../types/E13"
import { Selection } from "../../types/Selection"
import { AnalysisContext } from "../../context/AnalysisContext"
import { SelectionPicker } from "../selection"
import { SelectionContext } from "../../context/SelectionContext"
import { ReferredArgumentationContainer } from "../argumentation"


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
    const { highlightSelection, setActiveSelection } = useContext(SelectionContext)
    const { availableOntologies, editable } = useContext(AnalysisContext)

    const [currentTreatise, setCurrentTreatise] = useState<Ontology>()
    const [property, setProperty] = useState(e13.property)
    const [expectedRange, setExpectedRange] = useState<string | null>(null)
    const [attribute, setAttribute] = useState<Selection | UrlString>(e13.attribute)
    const [comment, setComment] = useState(e13?.comment)

    const [assignSelectionOpen, setAssignSelectionOpen] = useState(false)

    useEffect(() => {
        if (!e13) return

        setProperty(e13.property)
        setAttribute(e13.attribute)
        setComment(e13.comment)
        setCurrentTreatise(availableOntologies.find(ontology => ontology.url === e13.treatise))
    }, [e13, availableOntologies])

    useEffect(() => {
        if (!currentTreatise || !availableDomains.length) return

        console.log(currentTreatise.propertiesWithDomain(availableDomains[0]))
    }, [currentTreatise, availableDomains])

    return (
        <div style={{ minWidth: '200px', maxWidth: '350px' }}>
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
                        <Stack direction='row' alignItems='end'>
                            {editable && (
                                <FormControl variant='standard'>
                                    <InputLabel>the selection …</InputLabel>
                                    <Select
                                        style={{ minWidth: '150px' }}
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
                            )}

                            {property === RDF.type && editable ? (
                                <FormControl variant='standard'>
                                    <InputLabel>Assigned Object</InputLabel>

                                    <Select
                                        disabled={!editable}
                                        sx={{ minWidth: '150px' }}
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
                                    {editable &&
                                        <>
                                            {typeof attribute === "string"
                                                ? <div>{attribute}</div>
                                                : <IconButton
                                                    onMouseOver={() => {
                                                        highlightSelection(attribute.url)
                                                    }}
                                                    onClick={() => {
                                                        setActiveSelection(attribute.url)
                                                    }}>
                                                    <HighlightAlt />
                                                </IconButton>
                                            }

                                            <Tooltip title={`Assign ${expectedRange?.split('/').at(-1) || 'Selection'}`}>
                                                <IconButton onClick={() => setAssignSelectionOpen(true)}>
                                                    <AddLink />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    }

                                    <SelectionPicker
                                        setAttribute={setAttribute}
                                        open={assignSelectionOpen}
                                        onClose={() => setAssignSelectionOpen(false)} />
                                </>
                            }
                        </Stack>
                    </>
                )}

                {<ReferredArgumentationContainer e13={e13} />}
            </Stack>

            {editable &&
                <AccordionActions>
                    <LoadingButton
                        color='secondary'
                        variant='outlined'
                        onClick={() => removeE13(e13)}>
                        <Delete />
                    </LoadingButton>

                    <LoadingButton
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
                </AccordionActions>
            }
        </div>
    )
}



