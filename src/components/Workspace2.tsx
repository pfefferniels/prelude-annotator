import { UrlString } from "@inrupt/solid-client"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import { useState } from "react"
import { ScoreSurfaceContext } from "../context/ScoreSurfaceContext"
import { AnalyticalLayer, AnalysisSelector } from "./analysis"
import { Evaluation } from "./statistics/Evaluation"
import { ScoreSurface } from "./score/ScoreSurface"
import { WorkSelector } from "./work"

export const Workspace2 = () => {
    const [scoreIsReady, setScoreIsReady] = useState(0)
    const [score, setScore] = useState<UrlString>()
    const [analyses, setAnalyses] = useState<UrlString[]>([])

    const [scoreSelectorOpen, setScoreSelectorOpen] = useState(false)
    const [analysisSelectorOpen, setAnalysisSelectorOpen] = useState(false)
    const [evaluationsOpen, setEvaluationsOpen] = useState(false)

    return (
        <div id='workspace'>
            <header id='app-bar'>
                <Button onClick={() => setScoreSelectorOpen(true)}>Open Work</Button>
                <Button
                    disabled={!score}
                    onClick={() => setAnalysisSelectorOpen(true)}>Available Analyses</Button>
                <Button onClick={() => setEvaluationsOpen(true)}>Show Statistical Review</Button>
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

                    <ScoreSurfaceContext.Provider value={{ workUrl: score, analyses, scoreIsReady }}>
                        {analyses.map(analysis => (
                            <AnalyticalLayer key={`analysis_${analysis}`} analysisUrl={analysis} />
                        ))}
                    </ScoreSurfaceContext.Provider>
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