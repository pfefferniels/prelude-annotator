import { UrlString } from "@inrupt/solid-client"
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, ListItemAvatar, Tab, Tabs } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { WorkspaceContext } from "../context/ScoreSurfaceContext"
import { AnalyticalLayer, AnalysisSelector } from "./analysis"
import { Evaluation } from "./statistics/Evaluation"
import { ScoreSurface } from "./score/ScoreSurface"
import { WorkSelector } from "./work"
import { Selection } from "../types/Selection"
import { Stack } from "@mui/system"
import { stringToColour } from "../helpers/string2color"
import { LoginForm } from "./Login"

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            <Box hidden={value !== index} sx={{ p: 3 }}>
                {children}
            </Box>
        </div>
    );
}

export const Workspace2 = () => {
    const [scoreIsReady, setScoreIsReady] = useState(0)
    const [score, setScore] = useState<UrlString>()
    const [analyses, setAnalyses] = useState<UrlString[]>([])

    const [scoreSelectorOpen, setScoreSelectorOpen] = useState(false)
    const [analysisSelectorOpen, setAnalysisSelectorOpen] = useState(false)
    const [evaluationsOpen, setEvaluationsOpen] = useState(false)

    const [currentTab, setCurrentTab] = useState(0)
    const selectionPanel = useRef<HTMLDivElement>()

    const [activeLayer, setActiveLayer] = useState<UrlString>()
    const [activeSelection, setActiveSelection] = useState<Selection>()

    useEffect(() => {
        // once the active selection changes, make sure that 
        // the active layer remains up-to-date.

    }, [activeSelection])

    return (
        <div id='workspace'>
            <header id='app-bar'>
                <Stack direction='row'>
                    <LoginForm />
                    <Button onClick={() => setScoreSelectorOpen(true)}>Open Work</Button>
                    <Button
                        disabled={!score}
                        onClick={() => setAnalysisSelectorOpen(true)}>Available Analyses</Button>
                    <Button onClick={() => setEvaluationsOpen(true)}>Show Statistical Review</Button>

                    {analyses.map(analysis =>
                        <ListItemAvatar
                            onClick={() => {
                                setActiveSelection(undefined)
                                setActiveLayer(analysis)
                            }}
                            key={`select_analysis_${analysis}`}>
                            <Avatar
                                sx={{
                                    bgcolor: stringToColour(analysis.split('#').at(-1) || analysis),
                                    borderWidth: analysis === activeLayer ? '4px' : '0px',
                                    borderColor: 'black',
                                    borderStyle: 'solid',
                                    boxSizing: 'border-box'
                                }}
                            > </Avatar>
                        </ListItemAvatar>
                    )}
                </Stack>
            </header>

            <Dialog
                open={evaluationsOpen}
                onClose={() => setEvaluationsOpen(false)}
                fullWidth
                maxWidth="md">
                <DialogTitle>Statistical Review</DialogTitle>
                <DialogContent>
                    <Evaluation />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEvaluationsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {score && (
                <>
                    <ScoreSurface meiUrl={score} onReady={() => setScoreIsReady(ready => ready + 1)} />

                    <WorkspaceContext.Provider value={{ workUrl: score, analyses, scoreIsReady, selectionPanel, activeSelection, setActiveSelection, setActiveLayer }}>
                        {analyses.map(analysis => (
                            <AnalyticalLayer
                                key={`analysis_${analysis}`}
                                analysisUrl={analysis}
                                active={activeLayer === analysis} />
                        ))}

                        <Drawer
                            variant='persistent'
                            open={true}
                            anchor='right'
                            PaperProps={{
                                sx: { width: "30vw" },
                            }}
                        >
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={currentTab} onChange={(_: React.SyntheticEvent, newValue: number) => {
                                    setCurrentTab(newValue)
                                }}>
                                    <Tab label="Attributes" />
                                </Tabs>
                            </Box>

                            <TabPanel value={currentTab} index={0}>
                                <div id="selection-panel" ref={(ref) => ref && (selectionPanel.current = ref)} />
                            </TabPanel>
                        </Drawer>
                    </WorkspaceContext.Provider>
                </>
            )}

            <WorkSelector
                open={scoreSelectorOpen}
                onClose={() => setScoreSelectorOpen(false)}
                setScore={setScore} />

            {score && (
                <AnalysisSelector
                    open={analysisSelectorOpen}
                    onClose={() => setAnalysisSelectorOpen(false)}
                    forWork={score}
                    setAnalyses={setAnalyses} />
            )}
        </div>
    )
}