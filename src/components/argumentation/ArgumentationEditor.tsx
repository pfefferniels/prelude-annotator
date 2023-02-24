import { getStringNoLocale, getThing, getWebIdDataset } from "@inrupt/solid-client";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Delete, Save } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Accordion, AccordionDetails, AccordionSummary, Button, FormControl, FormLabel, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useContext, useEffect, useState } from "react";
import { AnalysisContext } from "../../context/AnalysisContext";
import { Argumentation, Belief, BeliefValue, beliefValues } from "../../types/Belief";
import { E13Picker } from "../e13";

interface ArgumentationProps {
    argumentation: Argumentation
    saveArgumentation: (argumentation: Argumentation) => void
    removeArgumentation: () => void
}

export const ArgumentationEditor = ({ argumentation, saveArgumentation, removeArgumentation }: ArgumentationProps) => {
    const { editable } = useContext(AnalysisContext)

    const [note, setNote] = useState('')
    const [beliefs, setBeliefs] = useState<Belief[]>(argumentation.concluded)
    const [expanded, setExpanded] = useState(false)
    const [e13PickerOpen, setE13PickerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [actor, setActor] = useState('…')

    useEffect(() => {
        // get the name of the actor
        const fetchProfile = async () => {
            const profile = await getWebIdDataset(argumentation.carriedOutBy)
            const profileThing = getThing(profile, argumentation.carriedOutBy)
            profileThing && setActor(getStringNoLocale(profileThing, FOAF.name) || 'unknown')
        }

        fetchProfile()
    }, [argumentation])

    const createBelief = () => {
        setBeliefs(beliefs => [...beliefs, {
            url: '',
            that: '',
            holdsToBe: 'true',
            time: new Date(Date.now()),
            note: ''
        }])
    }

    useEffect(() => {
        // make sure that the component state is always up-to-date 
        // with the given argumentation prop
        setBeliefs(argumentation.concluded)
        setNote(argumentation.note)
    }, [argumentation])

    return (
        <Accordion
            onChange={(_, isExpanded) => setExpanded(isExpanded)}
            expanded={expanded}>
            <AccordionSummary>Argumentation</AccordionSummary>

            <AccordionDetails>
                <Stack>
                    <FormControl required={false}>
                        <FormLabel>Based on …</FormLabel>
                        <TextField
                            disabled={!editable}
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
                                        <TextField disabled size='small' value={belief.that} />
                                        <Button disabled={!editable} onClick={() => setE13PickerOpen(true)}>Select Proposition</Button>
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
                                            disabled={!editable}
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
                                                        key={`item_${beliefValue}`}>{beliefValue}</MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>because of …</FormLabel>
                                        <TextField
                                            disabled={!editable}
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

                    {editable && (
                        <>
                            <Button disabled={!editable} onClick={createBelief}>Add Belief</Button>
                            <Stack sx={{ marginTop: '1rem' }} direction='row'>
                                <LoadingButton
                                    color='secondary'
                                    variant='outlined'
                                    onClick={removeArgumentation}>
                                    <Delete />
                                </LoadingButton>

                                <LoadingButton
                                    variant='contained'
                                    loading={saving}
                                    startIcon={<Save />}
                                    onClick={
                                        async () => {
                                            setSaving(true)
                                            await saveArgumentation({
                                                // these information cannot be modified in this editor
                                                url: argumentation.url,
                                                carriedOutBy: argumentation.carriedOutBy,

                                                // update the conclusions to the new beliefs
                                                concluded: beliefs,
                                                note
                                            })
                                            setSaving(false)
                                            setExpanded(false)
                                        }}>
                                    Save Argumentation
                                </LoadingButton>
                            </Stack>
                        </>
                    )}
                </Stack>
            </AccordionDetails>
        </Accordion >
    )
};
