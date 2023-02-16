import { Button, Drawer, List, ListItem, ListItemText } from "@mui/material"
import { useContext, useState } from "react";
import { AnalysisContext } from "../context/AnalysisContext";
import { SelectionContext } from "../context/SelectionContext";
import { E13 } from "../types/E13";
import { urlAsLabel } from "./E13Summary";

interface E13PickerProps {
    open: boolean
    onReady: (e13?: E13) => void
}

export const E13Picker = ({ open, onReady }: E13PickerProps) => {
    const { availableE13s } = useContext(AnalysisContext)
    const { highlightSelection } = useContext(SelectionContext)

    const [hovered, setHovered] = useState<E13>()

    return (
        <Drawer anchor='right' open={open} onClose={() => onReady()}>
            <List>
                {availableE13s.map(proposition => {
                    return (
                        <ListItem
                            selected={proposition.url === hovered?.url}
                            onClick={() => {
                                onReady(proposition)
                            }}
                            onMouseOver={() => {
                                setHovered(proposition)
                                highlightSelection(proposition.target)
                            }}
                            key={`e13picker_${proposition.url}`}>
                            <ListItemText
                                primary={`${urlAsLabel(proposition.property)} → ${typeof proposition.attribute === 'string' && urlAsLabel(proposition.attribute)}`}
                                secondary={proposition.url} />
                        </ListItem>
                    );
                })}
            </List>

            <Button onClick={() => onReady()}>Cancel</Button>
        </Drawer>
    )
}