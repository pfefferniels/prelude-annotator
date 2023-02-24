import { asUrl, buildThing, createThing, getPodUrlAll, getSolidDataset, getSourceUrl, getStringNoLocale, getUrl, hasResourceInfo, overwriteFile, saveSolidDatasetAt, setThing, SolidDataset, Thing } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { RDF, RDFS } from "@inrupt/vocab-common-rdf";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, FormGroup, Switch, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { crm, crmdig, frbroo } from "../../helpers/namespaces";

interface WorkDialogProps {
    open: boolean
    onClose: () => void

    thing?: Thing
}

export const WorkDialog = ({ open, onClose, thing }: WorkDialogProps) => {
    // in case an existing work is passed, this dialog 
    // allows editing it - otherwise a new work is being 
    // created

    const { session } = useSession()

    const [dataset, setDataset] = useState<SolidDataset>()
    const [title, setTitle] = useState('')
    const [meiUri, setMeiUri] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!thing) return

        setTitle(getStringNoLocale(thing, crm('P102_has_title')) || 'unknown')
        setMeiUri(getUrl(thing, RDFS.label) || asUrl(thing) || '')
    }, [thing])

    useEffect(() => {
        const fetchPersonalDataset = async () => {
            if (!session.info.isLoggedIn ||
                !session.info.webId) return

            try {
                const podUrl = await getPodUrlAll(session.info.webId)
                setDataset(await getSolidDataset(`${podUrl}preludes/works.ttl`, { fetch: session.fetch as any }))
            }
            catch (e) {
                console.log(e)
            }
        }
        fetchPersonalDataset()
    }, [session, session.info.isLoggedIn, session.info.webId])

    const saveToPod = async () => {
        // always upload MEI documents into the private pod 
        // first. When publishing, share the link to others.

        if (!dataset) return

        setSaving(true)

        // Create or update the corresponding Work
        const meiThing = buildThing(createThing({
            url: meiUri
        }))
            .addUrl(RDF.type, crmdig('D1_Digital_Object'))
            .addUrl(RDF.type, crm('E31_Document'))
            .addUrl(RDF.type, frbroo('F1_Work'))
            .addUrl(RDFS.label, meiUri)
            .addStringNoLocale(crm('P102_has_title'), title)
            .build()

        const modifiedDataset = setThing(dataset, meiThing)

        if (hasResourceInfo(dataset)) {
            const savedDataset = await saveSolidDatasetAt(
                getSourceUrl(dataset),
                modifiedDataset,
                { fetch: session.fetch as any })

            const updatedDataset = await getSolidDataset(
                getSourceUrl(savedDataset),
                { fetch: session.fetch as any })

            setSaving(false)
            onClose()
        }
    }

    const saveMeiFile = async (meiSource: HTMLInputElement) => {
        if (!meiSource || !meiSource.files || meiSource.files.length === 0) {
            return
        }
        const meiFile = meiSource.files[0]

        // Upload the MEI file
        if (!dataset || !hasResourceInfo(dataset)) return
        let location = getSourceUrl(dataset)
        location = location.slice(0, location.lastIndexOf('/'))

        const savedMEI = await overwriteFile(
            `${location}/${v4()}.mei`,
            meiFile,
            { contentType: 'text/xml', fetch: session.fetch as any }
        )
        setMeiUri(getSourceUrl(savedMEI))
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create or Edit Work</DialogTitle>
            <DialogContent>
                <Stack spacing={3}>
                    <TextField size='small' variant='standard' label='Title' placeholder='Title' value={title} onChange={(e) => setTitle(e.target.value)} />

                    <input
                        style={{
                            display: 'none'
                        }}
                        type='file'
                        id='upload-mei'
                        name='upload-mei'
                        accept='.mei,.xml'
                        onChange={async (e) => {
                            await saveMeiFile(e.target as HTMLInputElement)
                        }}
                    />

                    <Stack direction='row' spacing={2}>
                        <Button>
                            <label htmlFor='upload-mei'>
                                Upload MEI
                            </label>
                        </Button>
                        <Divider orientation='vertical' flexItem>or</Divider>
                        <TextField size='small' variant='standard' label='MEI URL' value={meiUri} onChange={(e) => setMeiUri(e.target.value)} />
                    </Stack>
                    <FormGroup>
                        <FormControlLabel control={
                            <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                        } label="Make public?" />
                    </FormGroup>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button variant='contained' onClick={() => {
                    saveToPod()
                }}>{saving ? '…' : 'Save'}</Button>
                <Button variant='outlined' onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}