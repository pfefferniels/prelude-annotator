import { LinkSharp } from "@mui/icons-material";
import { IconButton, ListItem, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { Argumentation, Belief } from "../../types/Belief";
import { fetchName } from "../../helpers/fetchName";
import { ArgumentationEditor } from ".";

export const ArgumentationLinkButton = ({ argumentation, belief }: { argumentation: Argumentation; belief: Belief; }) => {
    const [editorOpen, setEditorOpen] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        fetchName(argumentation.carriedOutBy).then(name => setName(name || 'unknown'));
    }, [argumentation]);

    return (
        <ListItem secondaryAction={<IconButton
            onClick={() => setEditorOpen(true)}>
            <LinkSharp />
        </IconButton>}>
            <ListItemText primary={<div>Argumentation by <span style={{ color: 'gray' }}>{name}</span></div>} secondary={<div>holding this assignment to be <b>{belief.holdsToBe}</b></div>} />

            <ArgumentationEditor
                open={editorOpen} onClose={() => setEditorOpen(false)}
                argumentation={argumentation} />
        </ListItem>
    );
};
