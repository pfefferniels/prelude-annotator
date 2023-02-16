import { addUrl, buildThing, createAcl, createAclFromFallbackAcl, createThing, getSolidDataset, getSolidDatasetWithAcl, getThingAll, getUrl, getUrlAll, hasAccessibleAcl, hasResourceAcl, hasResourceInfo, saveAclFor, saveSolidDatasetAt, setAgentResourceAccess, setPublicResourceAccess, setThing, universalAccess, UrlString } from "@inrupt/solid-client";
import { SessionContext } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { CopyAll, Share } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, ListItemText, MenuItem, Select, TextField, Typography } from "@mui/material"
import { Stack } from "@mui/system";
import { useContext, useState } from "react";
import { frbroo } from "../helpers/namespaces";

interface ShareDialogProps {
    open: boolean
    onClose: () => void

    analysisUrl: UrlString
    forWork: UrlString
}

type ShareMode = 'private' | 'public'

export const ShareAnalysisDialog = ({ analysisUrl, forWork, open, onClose }: ShareDialogProps) => {
    const { session } = useContext(SessionContext)
    const [mode, setMode] = useState<ShareMode>('public')
    const [status, setStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved')

    const save = async () => {
        setStatus('saving')

        // load the dataset
        const dataset = await getSolidDatasetWithAcl(analysisUrl, { fetch: session.fetch as any })
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
            const things = getThingAll(publicDataset)

            let aggregationWork = things.find(thing => (
                getUrlAll(thing, RDF.type).includes(frbroo('F17_Aggregation_Work')) &&
                getUrl(thing, frbroo('R2_is_derivative_of')) === forWork
            ))

            if (!aggregationWork) {
                console.log(`It seems that no analyses have been published yet on this work:
                No F17 Aggregation Work has been found which relates to this work. Creating a new F17.`)
                aggregationWork = buildThing(createThing())
                    .addUrl(RDF.type, frbroo('F17_Aggregation_Work'))
                    .addUrl(frbroo('R2_is_derivative_of'), forWork)
                    .build()
            }

            aggregationWork = addUrl(aggregationWork, frbroo('R3_is_realised_in'), analysisUrl)

            const modifiedDataset = setThing(publicDataset, aggregationWork)

            // The public dataset has public 'append' rights.
            await saveSolidDatasetAt('https://storage.inrupt.com/d14d1c60-6851-4c65-86fa-062c6989387c/preludes/works(4).ttl', modifiedDataset)
        }

        setStatus('saved')
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Share Analysis</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>How would you like the share the analysis?</Typography>
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
                                        `This will set the reading rights on your analysis to public and attach a link
                                    to your analysis in a publicly available collection of analyses.`
                                    } />
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {status === 'saving' && (
                        <Stack direction='row'>
                            <TextField disabled value={analysisUrl} size='small' />
                            <IconButton onClick={() => navigator.clipboard.writeText(analysisUrl)}>
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