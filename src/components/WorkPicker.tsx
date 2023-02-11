import { asUrl, getFile, getSolidDataset, getSourceUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, hasResourceInfo, removeThing, saveSolidDatasetAt, Thing } from "@inrupt/solid-client"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { AddOutlined, Delete, Edit, OpenInNew } from "@mui/icons-material"
import { Drawer, IconButton, List, ListItem, ListItemText } from "@mui/material"
import { styled } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { crm, frbroo } from "../helpers/namespaces"
import { WorkDialog } from "./WorkDialog"
import { Selection } from "./Workspace"

// avoid overlapping secondary actions in the list
const StyledList = styled(List)(() => ({
    width: '100%',
    minWidth: 500
}));

interface WorkPickerProps {
    open: boolean
    onClose: () => void

    setWorkURI: (uri: string) => void
    setMEI: (mei: string) => void
    setSelections: (selections: Selection[]) => void
}

export const WorkPicker = ({ open, onClose, setWorkURI, setMEI, setSelections }: WorkPickerProps) => {
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext)
    const { session } = useSession()

    const [works, setWorks] = useState<{ thing: Thing, title: string }[]>([])
    const [selectedWork, setSelectedWork] = useState<Thing>()
    const [workDialogOpen, setWorkDialogOpen] = useState(false)

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
                    return {
                        thing,
                        title: getStringNoLocale(thing, crm('P102_has_title')) || 'untitled'
                    }
                })
        )
    }

    useEffect(() => {
        if (!open) return
        loadWorks()
    }, [dataset, open, onClose, setMEI, setSelections])

    const openWork = async (work: Thing) => {
        setWorkURI(asUrl(work))

        // load MEI
        const fileUrl = getUrl(work, RDFS.label)
        if (!fileUrl) {
            console.warn('no MEI url given')
            return
        }
        const xslt = await (await fetch('insertMeasures.xsl')).text()
        const xsltProcessor = new XSLTProcessor()
        xsltProcessor.importStylesheet(new DOMParser().parseFromString(xslt, 'application/xml'))

        const file = await getFile(fileUrl, { fetch: session.fetch })
        const mei = await file.text()
        const result = xsltProcessor.transformToDocument(new DOMParser().parseFromString(mei, 'application/xml'))

        setMEI(new XMLSerializer().serializeToString(result))

        // load selections
        if (!dataset) {
            console.warn('Cannot load any selections, no dataset given.')
            setSelections([])
            return
        }
    }

    return (
        <>
            <Drawer open={open} onClose={onClose}>
                <StyledList>
                    {works.map((work, i) => {
                        return (
                            <ListItem
                                key={`work_${i}`}
                                secondaryAction={
                                    <>
                                        <IconButton onClick={() => {
                                            setSelectedWork(work.thing)
                                            setWorkDialogOpen(true)
                                        }}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton onClick={async () => {
                                            if (dataset && hasResourceInfo(dataset)) {
                                                const modifiedDataset = removeThing(dataset, work.thing)
                                                const savedDataset = await saveSolidDatasetAt(getSourceUrl(dataset)!, modifiedDataset, { fetch: session.fetch as any})
                                                setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
                                            }
                                        }}>
                                            <Delete />
                                        </IconButton>
                                        <IconButton onClick={() => {
                                            openWork(work.thing)
                                            onClose()
                                        }}>
                                            <OpenInNew />
                                        </IconButton>
                                    </>
                                }>
                                <ListItemText
                                    primary={work.title}
                                    secondary={asUrl(work.thing).split('#').at(-1) || ''} />
                            </ListItem>
                        )
                    })}
                </StyledList>

                <IconButton onClick={() => setWorkDialogOpen(true)}>
                    <AddOutlined />
                </IconButton>
            </Drawer>
            <WorkDialog
                thing={selectedWork}
                open={workDialogOpen}
                onClose={() => {
                    setWorkDialogOpen(false)
                    loadWorks()
                }} />
        </>
    )
}