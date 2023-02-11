import { asUrl, buildThing, createThing, getSolidDataset, getSourceUrl, getStringNoLocale, getUrl, hasResourceInfo, overwriteFile, saveSolidDatasetAt, setStringNoLocale, setThing, setUrl, Thing } from "@inrupt/solid-client";
import { DatasetContext, useSession } from "@inrupt/solid-ui-react";
import { RDF, RDFS } from "@inrupt/vocab-common-rdf";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import { useContext, useEffect, useState } from "react";
import { v4 } from "uuid";
import { crm, crmdig, frbroo } from "../helpers/namespaces";

interface WorkDialogProps {
    open: boolean
    onClose: () => void

    thing?: Thing
}

export const WorkDialog = ({ open, onClose, thing }: WorkDialogProps) => {
    // in case an existing work is passed, this dialog 
    // allows editing it - otherwise a new work is being 
    // created

    const { solidDataset: dataset, setDataset } = useContext(DatasetContext)
    const { session } = useSession()

    const [id, setId] = useState(v4())
    const [title, setTitle] = useState('')
    const [meiUri, setMeiUri] = useState('')

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!thing) return

        setId(asUrl(thing).split('#').at(-1) || v4())
        setTitle(getStringNoLocale(thing, crm('P102_has_title')) || 'unknown')
        setMeiUri(getUrl(thing, RDFS.label) || '')
    }, [thing])

    const saveToPod = async () => {
        if (!dataset) {
            console.warn('No dataset found')
            return
        }

        setSaving(true)

        // Create or update the corresponding Work
        const meiThing = buildThing(createThing({
            name: id
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

            setDataset(updatedDataset)
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
        const savedMEI = await overwriteFile(
            `https://pfefferniels.inrupt.net/preludes/${v4()}.mei`,
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