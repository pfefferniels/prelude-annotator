import { Drawer, List, ListItem, ListItemText } from "@mui/material"
import { useContext } from "react";
import { E13Context } from "../context/E13Context";
import { SelectionContext } from "../context/SelectionContext";
import { E13 } from "../types/E13";
import { urlAsLabel } from "./E13Summary";

interface E13PickerProps {
    open: boolean
    onReady: (e13?: E13) => void
}

export const E13Picker = ({ open, onReady }: E13PickerProps) => {
    const { availableE13s } = useContext(E13Context)
    const { highlightSelection } = useContext(SelectionContext)

    return (
        <Drawer anchor='right' open={open} onClose={() => onReady()}>
            <List>
                {availableE13s.map(proposition => {
                    return (
                        <ListItem
                            onClick={() => {
                                onReady(proposition)
                            }}
                            onMouseOver={() => highlightSelection(proposition.target.split('#').at(-1) || '')}
                            key={`e13picker_${proposition.id}`}>
                            <ListItemText
                                primary={`${urlAsLabel(proposition.property)} → ${urlAsLabel(proposition.attribute)}`}
                                secondary={proposition.id} />
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    )
}