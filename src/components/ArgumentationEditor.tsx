import { LoadingButton } from "@mui/lab";
import { Accordion, AccordionDetails, AccordionSummary, Button, FormControl, FormLabel, MenuItem, Select, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import { useContext } from "react";
import { E13Context } from "../context/E13Context";
import { Argumentation, beliefValues } from "../types/Belief";
import { E13 } from "../types/E13";

interface ArgumentationProps {
    argumentation: Argumentation
    saveArgumentation: (argumentation: Argumentation) => void
}

export const ArgumentationEditor = ({ argumentation, saveArgumentation }: ArgumentationProps) => {
    const { availableE13s } = useContext(E13Context)

    return (
        <Accordion>
            <AccordionSummary>Argumentation</AccordionSummary>

            <AccordionDetails>
                <Stack>
                    <FormControl>
                        <FormLabel>Argue that this proposition holds to be …</FormLabel>
                        <Select size='small'>
                            {beliefValues.map(beliefValue => {
                                return (
                                    <MenuItem
                                        value={beliefValue}
                                        key={`${beliefValue}`}>{beliefValue}</MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    {['belief1'].map(belief => {
                        return (
                            <Stack direction='column'>
                                <FormControl>
                                    <FormLabel required={false}>and that …</FormLabel>
                                    <Select size='small'>
                                        {['1', '2', '3'].map(otherProposition => {
                                            return (
                                                <MenuItem key={`${belief}_${otherProposition}`}>
                                                    {otherProposition}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel required={false}>is</FormLabel>
                                    <Select size='small'>
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
                    <Button>Add Belief</Button>

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

                    <LoadingButton onClick={() => saveArgumentation(argumentation)}>
                        Save
                    </LoadingButton>
                </Stack>
            </AccordionDetails>
        </Accordion>
    )
};
