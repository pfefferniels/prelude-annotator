import { LoadingButton } from "@mui/lab";
import { Accordion, AccordionDetails, AccordionSummary, Button, FormControl, FormLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useContext, useEffect, useState } from "react";
import { E13Context } from "../context/E13Context";
import { Argumentation, Belief, BeliefValue, beliefValues } from "../types/Belief";
import { E13 } from "../types/E13";

interface ArgumentationProps {
    argumentation: Argumentation
    saveArgumentation: (argumentation: Argumentation) => void
}

export const ArgumentationEditor = ({ argumentation, saveArgumentation }: ArgumentationProps) => {
    const { availableE13s } = useContext(E13Context)

    const [beliefs, setBeliefs] = useState<Belief[]>(argumentation.concluded)
    const [expanded, setExpanded] = useState(false)

    const createBelief = () => {
        setBeliefs(beliefs => [...beliefs, {
            url: '',
            that: '',
            holdsToBe: 'questionable',
            time: new Date(Date.now())
        }])
    }

    useEffect(() => {
        // make sure that the component state is always up-to-date 
        // with the given argumentation prop
        setBeliefs(argumentation.concluded)
    }, [argumentation])

    return (
        <Accordion
            onChange={(_, isExpanded) => setExpanded(isExpanded)}
            expanded={expanded}>
            <AccordionSummary>Argumentation</AccordionSummary>

            <AccordionDetails>
                <Stack>
                    <Typography>Belief …</Typography>

                    {beliefs.map((belief, i) => {
                        return (
                            <Stack key={`belief_${i}`} direction='column'>
                                <FormControl>
                                    <FormLabel required={false}>that …</FormLabel>
                                    <Select
                                        value={belief.that}
                                        onChange={(e) => {
                                            const newBeliefs = beliefs.slice()
                                            newBeliefs[i].that = e.target.value
                                            setBeliefs(newBeliefs)
                                        }}
                                        size='small'>
                                        {availableE13s.map(proposition => {
                                            return (
                                                <MenuItem
                                                    value={proposition.id}
                                                    key={`${belief.url}_${proposition.id}`}>
                                                    {proposition.id}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel required={false}>holds to be</FormLabel>
                                    <Select
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

                                <TextField
                                    disabled
                                    size='small'
                                    label='Note' />
                            </Stack>
                        );
                    })}
                    <Button onClick={createBelief}>Add Belief</Button>

                    <FormControl required={false}>
                        <FormLabel>based on</FormLabel>
                        <Select size='small'>
                            <MenuItem>Belief Adoption</MenuItem>
                            <MenuItem>Method or Reasoning</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl required={false}>
                        <FormLabel>Description of adopted belief or the applied method</FormLabel>
                        <TextField
                            required={false}
                            placeholder="Argument ..." />
                    </FormControl>

                    <LoadingButton onClick={
                        () => {
                            saveArgumentation({
                                // this information cannot be modified in this editor
                                url: argumentation.url,
                                carriedOutBy: argumentation.carriedOutBy,

                                // update the conclusions to the new beliefs
                                concluded: beliefs
                            })
                            setExpanded(false)
                        }}>
                        Save
                    </LoadingButton>
                </Stack>
            </AccordionDetails>
        </Accordion>
    )
};
