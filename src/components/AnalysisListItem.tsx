import { Access, AgentAccess, getAgentAccess, getPublicAccess, getSolidDataset, getSolidDatasetWithAcl, getStringNoLocale, getThing, getUrl, getWebIdDataset, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Publish, Share } from "@mui/icons-material";
import { Avatar, Checkbox, Divider, IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm } from "../helpers/namespaces";
import { stringToColour } from "../helpers/string2color";
import { urlAsLabel } from "./E13Summary";

export interface AnalysisListItemProps {
    expression: UrlString
    checked: boolean
    onChange: () => void
}

export const AnalysisListItem = ({ expression, checked, onChange }: AnalysisListItemProps): JSX.Element => {
    const { session } = useSession();
    const [owner, setOwner] = useState('')
    const [myRights, setMyRights] = useState<Access | null>()
    const [isPublic, setIsPublic] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)

    useEffect(() => {
        // try to define the owner and the rights. TODO: The path 
        // seems complicated and slow. Can it be done simplier?
        const fetchOwner = async () => {
            let dataset
            try {
                dataset = await getSolidDatasetWithAcl(expression, { fetch: session.fetch as any });
            }
            catch (e) {
                console.log(e)
            }

            if (!dataset) {
                setIsDeleted(true)
                return
            }

            if (session.info.webId) {
                setMyRights(await getAgentAccess(dataset, session.info.webId))
            }
            setIsPublic(await getPublicAccess(dataset)?.read || false)

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

    if (isDeleted) {
        return (
            <>
                <ListItem>
                    <ListItemAvatar>
                        <Avatar
                            sx={{ bgcolor: 'white' }}
                        > </Avatar>
                    </ListItemAvatar>

                    <ListItemText primary={<i>The analysis has been deleted.</i>} />
                </ListItem>
                <Divider variant='inset' />
            </>
        )
    }

    return (
        <>
            <ListItem
                secondaryAction={
                    <>
                        {myRights?.write && (
                            <IconButton>
                                <Share />
                            </IconButton>
                        )}
                        <Checkbox
                            edge="end"
                            onChange={onChange}
                            checked={checked} />
                    </>
                }
                disablePadding
            >
                <ListItemButton>
                    <ListItemAvatar>
                        <Avatar
                            sx={{ bgcolor: stringToColour(expression) }}
                        > </Avatar>
                    </ListItemAvatar>
                    <ListItemText id={expression} primary={owner} secondary={
                        <div>
                            {urlAsLabel(expression)}
                            <br />{isPublic && <b>publicly available</b>}
                            <br />Your access rights: {myRights?.read && 'read'}, {myRights?.write && 'write'}
                        </div>} />
                </ListItemButton>
            </ListItem>
            <Divider variant='inset' />
        </>
    );
};
