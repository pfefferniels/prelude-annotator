import { UrlString } from "@inrupt/solid-client"
import { Button } from "@mui/material"
import { useState } from "react"
import { ScoreSurfaceContext } from "../context/ScoreSurfaceContext"
import { ThingFromDataset } from "../types/ThingFromDataset"
import { AnalysisSelector } from "./AnalysisSelector"
import { AnalyticalLayer } from "./AnalyticalLayer"
import { ScoreSurface } from "./ScoreSurface"
import { WorkSelector } from "./WorkSelector"

export const Workspace2 = () => {
    const [scoreIsReady, setScoreIsReady] = useState(0)
    const [score, setScore] = useState<UrlString>()
    const [analyses, setAnalyses] = useState<UrlString[]>([])

    const [scoreSelectorOpen, setScoreSelectorOpen] = useState(false)
    const [analysisSelectorOpen, setAnalysisSelectorOpen] = useState(false)

    return (
        <div id='workspace'>
            <header id='app-bar'>
                <Button onClick={() => setScoreSelectorOpen(true)}>Open Work</Button>
                <Button
                    disabled={!score}
                    onClick={() => setAnalysisSelectorOpen(true)}>Available Analyses</Button>
            </header>

            {score && (
                <>
                    <ScoreSurface meiUrl={score} onReady={() => setScoreIsReady(ready => ready + 1)} />

                    <ScoreSurfaceContext.Provider value={{ workUrl: score, scoreIsReady }}>
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