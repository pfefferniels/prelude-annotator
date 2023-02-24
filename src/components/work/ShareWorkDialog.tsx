import { asUrl, createAcl, getFileWithAcl, getSolidDataset, getSourceUrl, hasAccessibleAcl, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess, setThing, Thing } from "@inrupt/solid-client";
import { SessionContext } from "@inrupt/solid-ui-react";
import { CopyAll, Share } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, ListItemText, MenuItem, Select, TextField, Typography } from "@mui/material"
import { Stack } from "@mui/system";
import { useContext, useState } from "react";

interface ShareDialogProps {
    open: boolean
    onClose: () => void

    work: Thing
}

type ShareMode = 'private' | 'public'

export const ShareWorkDialog = ({ work, open, onClose }: ShareDialogProps) => {
    const { session } = useContext(SessionContext)
    const [mode, setMode] = useState<ShareMode>('public')
    const [status, setStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved')

    const save = async () => {
        setStatus('saving')

        // load the dataset
        try {
            const dataset = await getFileWithAcl(asUrl(work), { fetch: session.fetch as any })
            if (!hasAccessibleAcl(dataset)) {
                return
            }

            // change the reading rights for public
            const newAcl = createAcl(dataset);
            let updatedAcl = setPublicResourceAccess(newAcl, { read: true, append: false, write: false, control: false })
            updatedAcl = setAgentResourceAccess(updatedAcl, session.info.webId!, { read: true, append: true, write: true, control: true })
            await saveAclFor(dataset, updatedAcl, { fetch: session.fetch as any })

            // load dataset a lute-preludes.inrupt.net/works.ttl
            if (mode === 'public') {
                const publicDataset = await getSolidDataset('https://storage.inrupt.com/d14d1c60-6851-4c65-86fa-062c6989387c/preludes/works(4).ttl')

                // insert the F1 Work into the public dataset
                const modifiedDataset = setThing(publicDataset, work)

                // The public dataset has public 'append' rights.
                await saveSolidDatasetAt(getSourceUrl(publicDataset)!, modifiedDataset)
            }

        }
        catch (e) {
            // ACL can't be retrieved -> the work cannot be shared.
        }

        setStatus('saved')
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Share Analysis</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>How would you like the share the work?</Typography>
                    <FormControl fullWidth>
                        <InputLabel id="mode-select-label">Share Mode</InputLabel>
                        <br />
                        <Select
                            size='small'
                            labelId="mode-select-label"
                            id="mode-select"
                            value={mode}
                            label="Age"
                            onChange={(e) => setMode(e.target.value as ShareMode)}
                            renderValue={(selected) => selected}
                        >
                            <MenuItem value={'private'}>
                                <ListItemText
                                    primary='Privately'
                                    secondary={
                                        `This will provide you with a link which you then can share to others.`
                                    } />
                            </MenuItem>
                            <MenuItem value={'public'}>
                                <ListItemText
                                    primary='Publicly'
                                    secondary={
                                        `This will set the reading rights of the MEI encoding to public and attach a link
                                    to the encoding in a publicly available dataset.`
                                    } />
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {status === 'saving' && (
                        <Stack direction='row'>
                            <TextField disabled value={asUrl(work)} size='small' />
                            <IconButton onClick={() => navigator.clipboard.writeText(asUrl(work))}>
                                <CopyAll />
                            </IconButton>
                        </Stack>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <LoadingButton
                    startIcon={<Share />}
                    loading={status === 'saving'}
                    variant='contained'
                    onClick={async () => {
                        await save()
                        onClose()
                    }}
                >
                    Share
                </LoadingButton>
                <Button variant='outlined' onClick={() => onClose()}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}