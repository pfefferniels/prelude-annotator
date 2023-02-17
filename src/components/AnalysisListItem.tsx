import { Access, AgentAccess, getAgentAccess, getPublicAccess, getSolidDataset, getSolidDatasetWithAcl, getSourceUrl, getStringNoLocale, getThing, getUrl, getWebIdDataset, hasAccessibleAcl, universalAccess, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Publish, Share } from "@mui/icons-material";
import { Avatar, Checkbox, Divider, IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm } from "../helpers/namespaces";
import { stringToColour } from "../helpers/string2color";
import { urlAsLabel } from "./E13Summary";
import { ShareAnalysisDialog } from "./ShareAnalysisDialog"

export interface AnalysisListItemProps {
    forWork: UrlString
    expression: UrlString
    checked: boolean
    onChange: () => void
}

export const AnalysisListItem = ({ forWork, expression, checked, onChange }: AnalysisListItemProps): JSX.Element => {
    const { session } = useSession();
    const [owner, setOwner] = useState('')
    const [writable, setWritable] = useState(false)
    const [isPublic, setIsPublic] = useState(false)
    const [isDeleted, setIsDeleted] = useState(false)
    const [title, setTitle] = useState<string>()

    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    useEffect(() => {
        // try to define the owner and the rights. TODO: The path 
        // seems complicated and slow. Can it be done simplier?
        const fetchOwner = async () => {
            const dataset = await getSolidDataset(expression, { fetch: session.fetch as any });

            if (!dataset) {
                // if we are unable to fetch the resource, we assume 
                // that it has been deleted by the user.
                setIsDeleted(true)
                return
            }

            const analysis = getThing(dataset, expression);
            if (!analysis)
                return;
            
            setTitle(getStringNoLocale(analysis, crm('P102_has_title')) || undefined)

            const webId = getUrl(analysis, crm('P14_carried_out_by'));
            if (!webId)
                return;
            
            const webIdDataset = await getWebIdDataset(webId);
            if (!webIdDataset)
                return;

            const profile = getThing(webIdDataset, webId);
            if (!profile)
                return;

            if (`${getSourceUrl(webIdDataset)}#me` === session.info.webId) {
                if (hasAccessibleAcl(dataset)) {
                    const datasetWithAcl = await getSolidDatasetWithAcl(expression, { fetch: session.fetch as any });
                    setIsPublic(await getPublicAccess(datasetWithAcl)?.read || false)
                }
                else {
                    setIsPublic(false)
                }
                setWritable(true)
            }
            else {
                setIsPublic(true)
            }

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
                        {writable && (
                            <IconButton onClick={() => setShareDialogOpen(true)}>
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
                            {title ? title : urlAsLabel(expression)}
                            <br />{isPublic && <b>publicly available</b>}
                            <br />{writable ? 'writable' : 'read-only'}
                        </div>} />
                </ListItemButton>
            </ListItem>
            <Divider variant='inset' />

            <ShareAnalysisDialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                analysisUrl={expression}
                forWork={forWork} />
        </>
    );
};
