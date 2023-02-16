import { Access, AgentAccess, asUrl, getAgentAccess, getFileWithAcl, getPodUrlAll, getPodUrlAllFrom, getPublicAccess, getResourceAcl, getSolidDataset, getSolidDatasetWithAcl, getSourceUrl, getStringNoLocale, getThing, getUrl, getWebIdDataset, hasAccessibleAcl, Thing, universalAccess, Url, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Edit, Publish, Share } from "@mui/icons-material";
import { Avatar, Checkbox, Divider, IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm } from "../helpers/namespaces";
import { stringToColour } from "../helpers/string2color";
import { urlAsLabel } from "./E13Summary";
import { ShareAnalysisDialog } from "./ShareAnalysisDialog"
import { ShareWorkDialog } from "./ShareWorkDialog";

export interface WorkListItemProps {
    work: Thing
    selected: boolean
    onClick: () => void
}

export const WorkListItem = ({ selected, work, onClick }: WorkListItemProps): JSX.Element => {
    const { session } = useSession();
    const [isPublic, setPublic] = useState(false)
    const [modifiable, setModifiable] = useState(false)

    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    useEffect(() => {
        // try to define the owner and the rights. TODO: The path 
        // seems complicated and slow. Can it be done simplier?
        const fetchOwner = async () => {
            if (!work) return

            try {
                const withAcl = await getFileWithAcl(asUrl(work), { fetch: session.fetch as any })
                setPublic(getPublicAccess(withAcl)?.read || false)
                setModifiable(session.info.webId && getAgentAccess(withAcl, session.info.webId)?.write || false)
            }
            catch (e) {
                // if we do not manage to retrieve an ACL, assume 
                // that the resource is not our own, that we are
                // not supposed to modify it and that it is public
                setPublic(true)
                setModifiable(false)
            }
        };

        fetchOwner();
    }, [work]);

    return (
        <>
            <ListItem
                selected={selected}
                secondaryAction={
                    modifiable && (
                        <>
                            <IconButton onClick={() => setShareDialogOpen(true)}>
                                <Share />
                            </IconButton>
                            <IconButton onClick={() => { }}>
                                <Edit />
                            </IconButton>
                        </>
                    )
                }
                disablePadding
            >
                <ListItemButton>
                    <ListItemText
                        onClick={onClick}
                        id={`work${asUrl(work)}`}
                        primary={getStringNoLocale(work, crm('P102_has_title'))}
                        secondary={
                        <div>
                            {asUrl(work)}
                            <br />{isPublic && <b>publicly available</b>}
                            <br />{modifiable ? 'writable' : 'read-only'}
                        </div>} />
                </ListItemButton>
            </ListItem>
            <Divider variant='inset' />

            <ShareWorkDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} work={work} />
        </>
    );
};
