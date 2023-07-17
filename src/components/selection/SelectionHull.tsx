import React, { useContext, useEffect, useState } from "react";
import { Selection } from "../../types/Selection";
import { createPortal } from 'react-dom';
import { roundedHull } from "../../helpers/roundedHull";
import { UrlString } from "@inrupt/solid-client";
import { AnalysisContext } from "../../context/AnalysisContext";

interface SelectionOverlayProps {
    selection: Selection
    highlight: boolean
    secondaryHighlight: boolean
    removeSelection: (url: UrlString) => void
    setActiveSelection: (selection: Selection) => void
    svgBackground: Element
}

type Hull = {
    points: [number, number][]

    // the system <g> element, to which this hull belongs
    systemId: string
}

/**
 * This component draws a hull around a given selection 
 * into the `svgBackground` prop.
 */
export const SelectionHull = ({
    selection,
    highlight,
    secondaryHighlight,
    removeSelection,
    setActiveSelection,
    svgBackground }: SelectionOverlayProps) => {
    const { color } = useContext(AnalysisContext)
    // since system breaks may occur inside one selection, a single 
    // selection may consist of multiple hulls
    const [hulls, setHulls] = useState<Hull[]>([])

    useEffect(() => {
        const refs = selection.refs
        if (refs.length === 0) return

        // collect the points of the selection
        setHulls(
            refs
                .reduce((result, ref) => {
                    const el = document.querySelector(`[data-id='${ref}']`)?.querySelector('.notehead') as SVGGElement
                    if (!el) return result

                    const systemId = el.closest('.system')?.getAttribute('data-id') || ''
                    const bbox = el.getBBox()

                    const existingLine = result.find(hull => hull.systemId === systemId)

                    if (existingLine) {
                        // if the is a hull aleady in that system, extend it
                        existingLine.points = [
                            ...existingLine.points,
                            [bbox.x + 100, bbox.y + 100]
                        ]
                    }
                    else {
                        // create a new hull if we are in a new system
                        result.push({
                            points: [[bbox.x + 100, bbox.y + 100]],
                            systemId: systemId
                        } as Hull)
                    }

                    return result
                }, [] as Hull[])
        )
    }, [selection, removeSelection, setActiveSelection, svgBackground])

    return (
        <>
            {hulls.map(hull => {
                return (
                    createPortal(
                        <path
                            data-selection={selection.url}
                            fill={color}
                            className={`hull ${highlight ? 'hull-highlighted' : ''} ${secondaryHighlight ? 'hull-secondary-highlighted' : ''}`}
                            d={roundedHull(hull.points)}
                            onClick={(e) => {
                                if (e.altKey) removeSelection(selection.url)
                                else setActiveSelection(selection)
                            }} />,
                        svgBackground
                    ))
            })}
        </>
    )
}
