import { asUrl, getFile, getSolidDataset, getSourceUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, hasResourceInfo, removeThing, saveSolidDatasetAt, SolidDataset, Thing } from "@inrupt/solid-client"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { AddOutlined, Delete, Edit, ExpandCircleDown, OpenInNew } from "@mui/icons-material"
import { LoadingButton } from "@mui/lab"
import { Accordion, AccordionDetails, AccordionSummary, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, List, ListItem, ListItemText, TextField, Typography } from "@mui/material"
import { styled } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { crm, frbroo } from "../helpers/namespaces"
import { WorkDialog } from "./WorkDialog"
import { Selection } from "../types/Selection"

// avoid overlapping secondary actions in the list
const StyledList = styled(List)(() => ({
    width: '100%',
    minWidth: 500
}));

interface WorkAccordionProps {
    sourceDataset: SolidDataset
    setSourceDataset?: (dataset: SolidDataset) => void
    label: string
    openWork: (work: Thing, sourceDataset: SolidDataset) => void
}

const WorkAccordion = ({ sourceDataset, setSourceDataset, label, openWork }: WorkAccordionProps) => {
    const { session } = useSession()

    const [works, setWorks] = useState<{ thing: Thing, title: string }[]>([])
    const [selectedWork, setSelectedWork] = useState<Thing>()
    const [workDialogOpen, setWorkDialogOpen] = useState(false)

    const loadFromSource = () => {
        if (!sourceDataset) {
            console.warn('No dataset found')
            return
        }

        // get a list of the works found in the dataset
        const things = getThingAll(sourceDataset)
        console.log('things found:', things.length)
        setWorks(
            things
                .filter(thing => {
                    return getUrlAll(thing, RDF.type).includes(frbroo('F1_Work'))
                })
                .map(thing => {
                    return {
                        thing,
                        title: getStringNoLocale(thing, crm('P102_has_title')) || 'untitled'
                    }
                })
        )
    }

    useEffect(loadFromSource, [sourceDataset])

    return (
        <>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandCircleDown />}>
                    {label}
                </AccordionSummary>
                <AccordionDetails>
                    <StyledList>
                        {works.map((work, i) => {
                            return (
                                <ListItem
                                    key={`work_${i}`}
                                    secondaryAction={
                                        <>
                                            {
                                                setSourceDataset && (
                                                    <>
                                                        <IconButton onClick={() => {
                                                            setSelectedWork(work.thing)
                                                            setWorkDialogOpen(true)
                                                        }}>
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton onClick={async () => {
                                                            if (sourceDataset && hasResourceInfo(sourceDataset)) {
                                                                const modifiedDataset = removeThing(sourceDataset, work.thing)
                                                                const savedDataset = await saveSolidDatasetAt(getSourceUrl(sourceDataset), modifiedDataset, { fetch: session.fetch as any })
                                                                setSourceDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
                                                            }
                                                        }}>
                                                            <Delete />
                                                        </IconButton>
                                                    </>
                                                )
                                            }
                                            <IconButton onClick={() => {
                                                openWork(work.thing, sourceDataset)
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

                    {setSourceDataset && (
                        <IconButton onClick={() => setWorkDialogOpen(true)}>
                            <AddOutlined />
                        </IconButton>
                    )}
                </AccordionDetails>
            </Accordion>

            {setSourceDataset && (
                <WorkDialog
                    thing={selectedWork}
                    open={workDialogOpen}
                    onClose={() => {
                        setWorkDialogOpen(false)
                        loadFromSource()
                    }} />
            )}
        </>
    )
}

interface WorkPickerProps {
    open: boolean
    onClose: () => void

    setSourceDataset: (sourceDataset: SolidDataset) => void
    setWork: (work: Thing) => void
    setMEI: (mei: string) => void
    setSelections: (selections: Selection[]) => void
}

export const WorkPicker = ({ open, onClose, setWork, setSourceDataset, setMEI }: WorkPickerProps) => {
    const { solidDataset: personalDataset, setDataset: setPersonalDataset } = useContext(DatasetContext)
    const { session } = useSession()

    const [foreignDatasets, setForeignDatasets] = useState<SolidDataset[]>([])
    const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false)
    const [loadingDataset, setLoadingDataset] = useState(false)
    const [sourceUrl, setSourceUrl] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        // Add the persistent URL as standard to the "foreign" datasets
        // when mounting the component
        if (foreignDatasets.length === 0) {
            addSource('https://pfefferniels.inrupt.net/preludes/works.ttl')
        }
    }, [])

    const addSource = async (sourceUrl: string) => {
        setErrorMessage('')
        setLoadingDataset(true)
        try {
            const solidDataset = await getSolidDataset(sourceUrl)
            setForeignDatasets(datasets => [...datasets, solidDataset])
            setLoadingDataset(false)
            setAddSourceDialogOpen(false)
        }
        catch (e) {
            setErrorMessage((e as Error).message)
            setLoadingDataset(false)
        }
    }

    const openWork = async (work: Thing, sourceDataset: SolidDataset) => {
        setSourceDataset(sourceDataset)
        setWork(work)

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

        onClose()
    }

    return (
        <>
            <Drawer open={open} onClose={onClose}>
                {foreignDatasets.map((dataset, i) => (
                    <WorkAccordion
                        key={`dataset_accordion_${i}`}
                        sourceDataset={dataset}
                        openWork={openWork}
                        label={`Analyses from ${getSourceUrl(dataset)}`} />
                ))}

                {session.info.isLoggedIn && personalDataset && (
                    <WorkAccordion
                        openWork={openWork}
                        sourceDataset={personalDataset}
                        setSourceDataset={setPersonalDataset}
                        label='My Personal Analyses' />
                )}

                <Button onClick={() => setAddSourceDialogOpen(true)}>
                    Add Shared Source
                </Button>
            </Drawer>

            <Dialog open={addSourceDialogOpen} onClose={() => setAddSourceDialogOpen(false)}>
                <DialogTitle>
                    Add Source URL
                </DialogTitle>
                <DialogContent>
                    <TextField
                        value={sourceUrl}
                        onChange={(e) => {
                            setSourceUrl(e.target.value)
                        }}
                        placeholder='Your source URL (typically ending on .ttl)'
                        label='Source URL' />
                    {errorMessage && (<Typography>{errorMessage}</Typography>)}
                </DialogContent>
                <DialogActions>
                    <LoadingButton
                        onClick={() => {
                            addSource(sourceUrl)
                        }}
                        loading={loadingDataset}>
                        Add
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    )
}
