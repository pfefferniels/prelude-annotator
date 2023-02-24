import { UrlString } from "@inrupt/solid-client";
import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import { useContext, useState } from "react";
import { SelectionContext } from "../../context/SelectionContext";
import { Selection } from "../../types/Selection";
import { urlAsLabel } from "../../helpers/urlAsLabel";

interface SelectionPickerProps {
    open: boolean,
    onClose: () => void
    setAttribute: (attr: Selection | UrlString) => void
}

export const SelectionPicker = ({ open, onClose, setAttribute }: SelectionPickerProps) => {
    const { availableSelections, highlightSelection } = useContext(SelectionContext);

    const [hovered, setHovered] = useState<Selection>();

    return <Drawer open={open} onClose={onClose} anchor='right'>
        <List dense>
            {availableSelections.map((selection => {
                return (
                    <ListItem
                        selected={selection.url === hovered?.url}
                        onClick={() => {
                            setAttribute(selection);
                            onClose();
                        }}
                        onMouseOver={() => {
                            setHovered(selection);
                            highlightSelection(selection.url);
                        }}
                        key={`selection_picker_${selection.url}`}>
                        <ListItemText primary={urlAsLabel(selection.url)} />
                    </ListItem>
                );
            }))}
        </List>
    </Drawer>;
};
