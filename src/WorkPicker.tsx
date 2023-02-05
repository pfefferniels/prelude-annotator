import { asUrl, buildThing, createThing, getFile, getSourceUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, overwriteFile, saveSolidDatasetAt, setThing } from "@inrupt/solid-client"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { Add, OpenInNew } from "@mui/icons-material"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, List, ListItem, ListItemText, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { crm, crmdig, frbroo } from "./namespaces"
import { testMEI } from "./testMEI"
import { Selection } from "./Workspace"

interface WorkPickerProps {
    open: boolean
    onClose: () => void

    setWorkURI: (uri: string) => void
    setMEI: (mei: string) => void
    setSelections: (selections: Selection[]) => void
}

export const WorkPicker = ({ open, onClose, setWorkURI, setMEI, setSelections }: WorkPickerProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [meiFile, setMeiFile] = useState<File>()
    const [works, setWorks] = useState<string[]>([])

    const loadWorks = () => {
        if (!dataset) {
            console.warn('No dataset found')
            return
        }
        // get a list of the works found in the dataset
        const things = getThingAll(dataset)
        setWorks(
            things
                .filter(thing => {
                    return getUrlAll(thing, RDF.type).includes(frbroo('F15_Complex_Work'))
                })
                .map(thing => {
                    return getUrl(thing, RDFS.label)!
                })
        )
    }

    useEffect(() => {
        loadWorks()
    }, [open, onClose, setMEI, setSelections])

    const openWork = async (uri: string) => {
        setWorkURI(uri)

        // load MEI
        const file = await getFile(uri, { fetch: session.fetch })
        const mei = await file.text()
        setMEI(mei)

        // load selections
        if (!dataset) {
            console.warn('Cannot load any selections, no dataset given.')
            setSelections([])
            return
        }

        const things = getThingAll(dataset)
        setSelections(
            things
                .filter(thing => {
                    console.log(getUrl(thing, crm('P106i_forms_part_of')) === uri)
                    // TODO: should use has_type instead
                    return getUrlAll(thing, RDF.type).includes(crm('E90_Symbolic_Object')) &&
                        getUrl(thing, crm('P106i_forms_part_of')) === uri
                })
                .map(thing => {
                    const refs = getUrlAll(thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

                    // TODO read E13s
                    return {
                        id: asUrl(thing).split('#').at(-1) || '',
                        refs: refs,
                        attributes: []
                    }
                })
        )
    }

    const storeMEI = async (meiSource: HTMLInputElement) => {
        if (!meiSource || !meiSource.files || meiSource.files.length === 0) {
            return
        }
        setMeiFile(meiSource.files[0])
    }

    const createWork = async () => {
        if (!dataset) {
            console.warn('No dataset found to save the new work to.')
            return
        }

        if (!meiFile) {
            console.warn('no MEI uploaded')
            return
        }

        try {
            // Upload the MEI file
            const savedMEI = await overwriteFile(
                `https://pfefferniels.inrupt.net/preludes/${v4()}.mei`,
                meiFile,
                { contentType: 'text/xml', fetch: session.fetch as any }
            )
            const meiLocation = getSourceUrl(savedMEI)

            // (4) create the corresponding D1 Digital Object entities
            const meiThing = buildThing(createThing())
                .addUrl(RDF.type, crmdig('D1_Digital_Object'))
                .addUrl(RDF.type, crm('E31_Document'))
                .addUrl(RDF.type, frbroo('F15_Complex_Work'))
                .addUrl(RDFS.label, meiLocation)
                .build()

            const withWork = setThing(dataset, meiThing)

            return saveSolidDatasetAt(
                'https://pfefferniels.inrupt.net/preludes/works.ttl',
                withWork,
                { fetch: session.fetch as any })
        }
        catch (e) {
            console.warn(e)
        }
    }

    return (
        <Drawer open={open} onClose={onClose}>
            <Typography variant='h4'>Choose a Work</Typography>
            <List>
                {works.map((work, i) => {
                    return (
                        <ListItem
                            key={`work_${i}`}
                            secondaryAction={
                                <IconButton onClick={() => {
                                    openWork(work)
                                    onClose()
                                }}>
                                    <OpenInNew />
                                </IconButton>
                            }>
                            <ListItemText>{work}</ListItemText>
                        </ListItem>
                    )
                })}
            </List>

            <input
                style={{
                    display: 'none'
                }}
                type='file'
                id='upload-mei'
                name='upload-mei'
                accept='.mei,.xml'
                onChange={async (e) => {
                    await storeMEI(e.target as HTMLInputElement)
                    await createWork()
                    loadWorks()
                }}
            />
            <label htmlFor='upload-mei'>
                Upload MEI
            </label>
        </Drawer>
    )
}