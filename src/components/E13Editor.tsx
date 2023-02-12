import { asUrl, buildThing, createThing, getSolidDataset, getSourceUrl, getUrlAll, hasResourceInfo, saveSolidDatasetAt, setThing } from "@inrupt/solid-client"
import { DCTERMS, RDF } from "@inrupt/vocab-common-rdf"
import { Delete, Save } from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { Button, DialogActions, Drawer, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, TextField } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { Ontology } from "../helpers/Ontology"
import { E13 } from "../types/E13"
import { SelectionContext } from "../context/SelectionContext"
import { Argumentation } from "../types/Belief"
import { ArgumentationContext } from "../context/ArgumentationContext"
import { crm, crminf } from "../helpers/namespaces"
import { ArgumentationEditor } from "./ArgumentationEditor"
import { DatasetContext, SessionContext, useSession } from "@inrupt/solid-ui-react"
import { OntologyContext } from "../context/OntologyContext"

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
    const { session } = useSession()
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext)
    const { availableSelections, highlightSelection } = useContext(SelectionContext)
    const { availableArgumentations } = useContext(ArgumentationContext)
    const { availableOntologies } = useContext(OntologyContext)

    const [referredArgumentations, setReferredArgumentations] = useState<Argumentation[]>()

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
                        return belief.that === e13.id
                    })
                    return referredBelief !== undefined
                })
        )
    }, [availableArgumentations])

    const saveArgumentation = async (argumentation: Argumentation) => {
        if (!dataset || !hasResourceInfo(dataset)) return

        // stores the given argumentation into the personal POD
        const argumentationBuilder =
            buildThing(createThing(argumentation.url !== '' ? {
                url: argumentation.url
            } : undefined))
                .addUrl(RDF.type, crminf('I1_Argumentation'))
                .addUrl(crm('P14_carried_out_by'), argumentation.carriedOutBy)

        let modifiedDataset = dataset
        argumentation.concluded.map(belief => {
            return buildThing(createThing(belief.url !== '' ? {
                url: belief.url
            } : undefined))
                .addUrl(RDF.type, crminf('I2_Belief'))
                .addDate(DCTERMS.created, belief.time)
                .addDate(DCTERMS.modified, new Date(Date.now()))
                .addUrl(crminf('J4_that'), `${getSourceUrl(dataset)}#${belief.that}`)
                .addStringNoLocale(crminf('J5_holds_to_be'), belief.holdsToBe)
                .addStringNoLocale(crm('P3_has_note'), belief.note)
                .build()
        }).forEach(concludingBelief => {
            modifiedDataset = setThing(modifiedDataset, concludingBelief)
            argumentationBuilder.addUrl(crminf('J2_concluded_that'), concludingBelief)
        })

        modifiedDataset = setThing(modifiedDataset, argumentationBuilder.build())

        const savedDataset = await saveSolidDatasetAt(getSourceUrl(dataset), modifiedDataset, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
    }

    const removeArgumentation = async (argumentation: Argumentation) => {

    }

    const createArgumentation = () => {
        saveArgumentation({
            url: '',
            carriedOutBy: session.info.webId || '',
            concluded: [{
                url: '',
                time: new Date(Date.now()),
                that: e13.id,
                holdsToBe: 'true',
                note: ''
            }]
        })
    }

    return (
        <Paper style={{ minWidth: '200px' }}>
            <Stack spacing={2}>
                <FormControl variant='standard'>
                    <InputLabel>According to …</InputLabel>

                    <Select
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
                                    <Button onClick={() => setAssignSelectionOpen(true)}>assign {expectedRange?.split('/').at(-1) || 'selection'}</Button>
                                    <div>{attribute.split('#').at(-1)}</div>
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
                                </Stack>
                            }
                        </Stack>
                    </>
                )}

                {referredArgumentations?.map(arg => (
                    <ArgumentationEditor
                        key={`argumentation_editor_${arg.url}`}
                        argumentation={arg}
                        saveArgumentation={saveArgumentation} />
                ))}

                <Button onClick={async () => {
                    await saveE13({
                        // ID and provenience are immutable
                        provenience: e13.provenience,
                        id: e13.id,

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
                    createArgumentation()
                }}>Add Argumentation</Button>
            </Stack>

            <DialogActions>
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
                            // ID and provenience are immutable
                            provenience: e13.provenience,
                            id: e13.id,

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


