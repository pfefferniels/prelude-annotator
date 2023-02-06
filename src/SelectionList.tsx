import { Button, IconButton, List, ListItem, ListItemText } from "@mui/material";
import { Selection } from "./Workspace";
import Delete from "@mui/icons-material/Delete";
import { useState } from "react";
import { E13Editor } from "./E13Editor";
import { Add, Check, PlusOne } from "@mui/icons-material";

interface SelectionListProps {
    selections: Selection[]
    setSelections: (selections: Selection[]) => void

    activeSelection: string
    setActiveSelection: (id: string) => void
}

export const SelectionList = ({ selections, setSelections, activeSelection, setActiveSelection }: SelectionListProps) => {
    const removeSelection = (id: string) => {
        const newSelections = selections.slice()
        newSelections.splice(selections.findIndex(selection => selection.id === id), 1)
        setSelections(newSelections)
    }

    return (
        <>
            <List>
                {selections.map(selection => {
                    return (
                        <ListItem
                            key={`listitem_${selection.id}`}
                            onClick={() => setActiveSelection(selection.id)}
                            selected={selection.id === activeSelection}
                            secondaryAction={
                                <IconButton
                                    onClick={() => removeSelection(selection.id)}
                                    edge="end"
                                    aria-label="delete">
                                    <Delete />
                                </IconButton>
                            }>
                            <ListItemText
                                primary={selection.id}
                                secondary={`affects ${selection.refs.length} elements, ${selection.e13s.map(attr => attr.property).join(' ')}`} />
                        </ListItem>
                    )
                })}
            </List>
        </>
    )
}
