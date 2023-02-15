import { getSolidDataset, getStringNoLocale, getThing, getUrl, getWebIdDataset, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Avatar, Checkbox, ListItem, ListItemAvatar, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm } from "../helpers/namespaces";
import { stringToColour } from "../helpers/string2color";

export interface AnalysisListItemProps {
    expression: UrlString
    checked: boolean
    onChange: () => void
}

export const AnalysisListItem = ({ expression, checked, onChange }: AnalysisListItemProps): JSX.Element => {
    const { session } = useSession();
    const [owner, setOwner] = useState('');

    useEffect(() => {
        // try to define the owner. TODO: The path 
        // seems complicated and slow. Can it be done simplier?
        const fetchOwner = async () => {
            const dataset = await getSolidDataset(expression, { fetch: session.fetch as any });
            const analysis = getThing(dataset, expression);
            if (!analysis)
                return;

            const webId = getUrl(analysis, crm('P14_carried_out_by'));
            if (!webId)
                return;

            const webIdDataset = await getWebIdDataset(webId);
            if (!webIdDataset)
                return;

            const profile = getThing(webIdDataset, webId);
            if (!profile)
                return;

            setOwner(getStringNoLocale(profile, FOAF.name) || '');
        };

        fetchOwner();
    }, [expression]);

    return (
        <ListItem
            secondaryAction={<Checkbox
                edge="end"
                onChange={onChange}
                checked={checked} />}
            disablePadding
        >
            <ListItemButton>
                <ListItemAvatar>
                    <Avatar
                        sx={{ bgcolor: stringToColour(expression) }}
                    > </Avatar>
                </ListItemAvatar>
                <ListItemText id={expression} primary={owner} secondary={expression} />
            </ListItemButton>
        </ListItem>
    );
};
