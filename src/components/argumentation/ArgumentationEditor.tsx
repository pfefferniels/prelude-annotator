import { asUrl, buildThing, createThing, getSolidDataset, getSourceUrl, getStringNoLocale, getThing, getThingAll, getUrlAll, hasResourceInfo, removeThing, saveSolidDatasetAt, setThing, SolidDataset, Thing } from "@inrupt/solid-client";
import { DCTERMS, RDF } from "@inrupt/vocab-common-rdf";
import { Delete, EditOff, ModeEdit, Save } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useContext, useEffect, useState } from "react";
import { fetchName } from "../../helpers/fetchName";
import { Argumentation, Belief, BeliefValue, beliefValues } from "../../types/Belief";
import { E13Picker } from "../e13";
import { useSession } from "@inrupt/solid-ui-react";
import { v4 } from "uuid";
import { crminf, crm } from "../../helpers/namespaces";
import { WorkspaceContext } from "../../context/ScoreSurfaceContext";
import { hasWriteAccessTo } from "../../helpers/hasWriteAccess";

interface AnalysisPickerProps {
    thing?: Thing
    selectable: boolean
    onSelect: (thing: Thing) => void
}

const AnalysisPicker = ({ thing, selectable, onSelect }: AnalysisPickerProps) => {
    const { session } = useSession()
    const { analyses } = useContext(WorkspaceContext)

    const [analysisThings, setAnalysisThings] = useState<Thing[]>([])
    const [selectedThing, setSelectedThing] = useState<Thing | undefined>(thing)

    useEffect(() => {
        const fetchAnalyses = async () => {
            if (selectable && !session.info.webId) return

            const things = []
            for (const analysis of analyses) {
                if (selectable && session.info.webId &&
                    !(await hasWriteAccessTo(analysis, session.info.webId, session.fetch)))
                    continue

                const dataset = await getSolidDataset(analysis, { fetch: session.fetch as any })
                if (!dataset) continue

                const analysisThing = getThing(dataset, analysis)
                if (!analysisThing) continue

                things.push(analysisThing)
            }
            setAnalysisThings(things)
        }
        fetchAnalyses()
    }, [analyses, session, selectable])

    return (
        <FormControl>
            <FormLabel>Containing Analysis</FormLabel>
            <Select
                size='small'
                disabled={!selectable}
                value={(selectedThing && asUrl(selectedThing)) || ''}
                onChange={(e) => {
                    const selected = analysisThings.find(thing => asUrl(thing) === e.target.value)
                    if (!selected) return

                    setSelectedThing(selected)
                    onSelect(selected)
                }}>
                {analysisThings.map(thing => (
                    <MenuItem key={`select_analysis_${asUrl(thing)}`} value={asUrl(thing)}>
                        {getStringNoLocale(thing, crm('P102_has_title')) || 'no title'}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

interface ArgumentationProps {
    argumentation: Argumentation
    open: boolean
    onClose: () => void
}

/**
 * View, edit, create or delete argumentations. 
 */
export const ArgumentationEditor = ({ argumentation, open, onClose }: ArgumentationProps) => {
    const { session } = useSession()

    const [analysisDataset, setAnalysisDataset] = useState<SolidDataset>()
    const [analysisThing, setAnalysisThing] = useState<Thing>()
    const [writable, setWritable] = useState(false)
    const [note, setNote] = useState('')
    const [beliefs, setBeliefs] = useState<Belief[]>(argumentation?.concluded || [])
    const [e13PickerOpen, setE13PickerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [actor, setActor] = useState('…')

    const createBelief = () => {
        setBeliefs(beliefs => [...beliefs, {
            url: '',
            that: '',
            holdsToBe: 'true',
            time: new Date(Date.now()),
            note: ''
        }])
    }

    // as soon as the containing dataset changes, re-evaluate if we 
    // do have write access to it
    useEffect(() => {
        if (!analysisDataset || !session.info.webId) {
            setWritable(false)
            return
        }

        hasWriteAccessTo(getSourceUrl(analysisDataset) || '', session.info.webId, session.fetch)
            .then(writeAccess => setWritable(writeAccess))
    }, [analysisDataset, session])

    useEffect(() => {
        // make sure that the component state is always up-to-date 
        // with the given argumentation prop
        setBeliefs(argumentation?.concluded || [])
        setNote(argumentation?.note || '')

        // get the name of the actor
        fetchName(argumentation.carriedOutBy).then(name => setActor(name || 'unknown'))

        const fetchContainingDataset = async () => {
            if (argumentation.url.length) {
                const containingDataset = await getSolidDataset(argumentation.url, { fetch: session.fetch as any })
                setAnalysisDataset(containingDataset)

                const things = getThingAll(containingDataset)

                console.log('containing dataset=', things.find(thing =>
                    getUrlAll(thing, RDF.type).includes(crm('E7_Activity')) &&
                    getUrlAll(thing, crm('P3_consists_of')).includes(argumentation.url)))

                setAnalysisThing(things.find(thing =>
                    getUrlAll(thing, RDF.type).includes(crm('E7_Activity')) &&
                    getUrlAll(thing, crm('P3_consists_of')).includes(argumentation.url)))
            }
        }

        fetchContainingDataset()
    }, [argumentation, session])

    const save = async () => {
        if (!analysisDataset || !hasResourceInfo(analysisDataset)) return

        // stores the given argumentation into the personal POD
        const url = argumentation.url.length
            ? argumentation.url
            : `${getSourceUrl(analysisDataset)}#${v4()}`

        const argumentationBuilder =
            buildThing(createThing({
                url
            }))
                .addUrl(RDF.type, crminf('I1_Argumentation'))
                .addUrl(crm('P14_carried_out_by'), argumentation.carriedOutBy)
                .addStringNoLocale(crm('P3_has_note'), argumentation.note)

        let modifiedDataset = analysisDataset
        beliefs.map(belief => {
            return buildThing(createThing(belief.url.length ? {
                url: belief.url
            } : undefined))
                .addUrl(RDF.type, crminf('I2_Belief'))
                .addDate(DCTERMS.created, belief.time)
                .addDate(DCTERMS.modified, new Date(Date.now()))
                .addUrl(crminf('J4_that'), belief.that)
                .addStringNoLocale(crminf('J5_holds_to_be'), belief.holdsToBe)
                .addStringNoLocale(crm('P3_has_note'), belief.note)
                .build()
        }).forEach(concludingBelief => {
            modifiedDataset = setThing(modifiedDataset, concludingBelief)
            argumentationBuilder.addUrl(crminf('J2_concluded_that'), concludingBelief)
        })

        if (!analysisThing) {
            console.log('Analysis not present yet.')
            return
        }

        const updatedAnalysis = buildThing(analysisThing)
        updatedAnalysis.addUrl(crm('P3_consists_of'), url)

        modifiedDataset = setThing(modifiedDataset, argumentationBuilder.build())
        modifiedDataset = setThing(modifiedDataset, updatedAnalysis.build())

        await saveSolidDatasetAt(getSourceUrl(analysisDataset), modifiedDataset, { fetch: session.fetch as any })
    }

    const remove = async () => {
        if (!analysisDataset || !hasResourceInfo(analysisDataset)) return
        const argumentationToRemove = getThing(analysisDataset, argumentation.url)
        const beliefsToRemove = argumentation.concluded.map(belief => {
            return getThing(analysisDataset, belief.url) || null
        })
            .filter(thing => thing !== null)

        // first remove the argumentation itself
        let modifiedDataset = analysisDataset
        if (argumentationToRemove) {
            modifiedDataset = removeThing(analysisDataset, argumentationToRemove)
        }

        // and then all the associated belief values
        beliefsToRemove.forEach(beliefThing => {
            modifiedDataset = removeThing(modifiedDataset, beliefThing!)
        })

        await saveSolidDatasetAt(getSourceUrl(analysisDataset), modifiedDataset, { fetch: session.fetch as any })
    }

    return (
        <Dialog fullWidth open={open} onClose={onClose}>
            <DialogTitle>Argumentation {writable ? <ModeEdit /> : <EditOff />}</DialogTitle>

            <DialogContent>
                <Stack>
                    {
                        <AnalysisPicker
                            thing={analysisThing}
                            selectable={session.info.isLoggedIn && !argumentation.url.length}
                            onSelect={async (thing) => {
                                setAnalysisDataset(await getSolidDataset(asUrl(thing), { fetch: session.fetch as any }))
                                setAnalysisThing(thing)
                            }} />
                    }

                    <FormControl required={false}>
                        <FormLabel>Based on …</FormLabel>
                        <TextField
                            disabled={!writable}
                            variant='standard'
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            size='small'
                            required={false}
                            placeholder="Specify a method or logic, e.g. a literature reference, musical intuition etc." />
                    </FormControl>

                    <Typography><span style={{ color: 'gray' }}>{actor}</span> concludes that …</Typography>

                    {beliefs.map((belief, i) => {
                        return (
                            <Paper sx={{ margin: '1rem' }}>
                                <Stack sx={{ margin: '1rem' }} key={`belief_${i}`} direction='column'>
                                    <FormControl>
                                        <FormLabel required={false}>the proposition …</FormLabel>
                                        <TextField disabled variant='standard' size='small' value={belief.that} />
                                        {writable && <Button onClick={() => setE13PickerOpen(true)}>Select Proposition</Button>}
                                        {e13PickerOpen && (
                                            <E13Picker
                                                open={e13PickerOpen}
                                                onReady={(e13) => {
                                                    if (!e13) {
                                                        setE13PickerOpen(false)
                                                        return
                                                    }
                                                    setBeliefs(beliefs => {
                                                        const newBeliefs = beliefs.slice()
                                                        newBeliefs[i].that = e13.url
                                                        return newBeliefs
                                                    })
                                                    setE13PickerOpen(false)
                                                }} />)}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel required={false}>holds to be</FormLabel>
                                        <Select
                                            disabled={!writable}
                                            variant='standard'
                                            value={belief.holdsToBe}
                                            onChange={(e) => {
                                                const newBeliefs = beliefs.slice()
                                                newBeliefs[i].holdsToBe = e.target.value as BeliefValue
                                                setBeliefs(newBeliefs)
                                            }}
                                            size='small'>
                                            {beliefValues.map(beliefValue => {
                                                return (
                                                    <MenuItem
                                                        value={beliefValue}
                                                        key={`item_${beliefValue} `}>{beliefValue}</MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>because of …</FormLabel>
                                        <TextField
                                            multiline
                                            variant='standard'
                                            disabled={!writable}
                                            value={belief.note}
                                            onChange={(e) => {
                                                setBeliefs(beliefs => {
                                                    const newBeliefs = beliefs.slice()
                                                    newBeliefs[i].note = e.target.value
                                                    return newBeliefs
                                                })
                                            }}
                                            size='small'
                                            placeholder='explanatory note on this belief'
                                            label='Note' />
                                    </FormControl>
                                </Stack>
                            </Paper>
                        );
                    })}

                    {writable && (
                        <>
                            <Button disabled={!writable} onClick={createBelief}>Add Belief</Button>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                {writable && (
                    <>
                        <LoadingButton
                            color='secondary'
                            variant='outlined'
                            onClick={remove}>
                            <Delete />
                        </LoadingButton>

                        <LoadingButton
                            variant='contained'
                            loading={saving}
                            startIcon={<Save />}
                            onClick={
                                async () => {
                                    setSaving(true)
                                    await save()
                                    setSaving(false)
                                }}>
                            Save Argumentation
                        </LoadingButton>
                    </>
                )}

                <Button variant='outlined' onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
};
