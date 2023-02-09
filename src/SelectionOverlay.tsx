import React, { useEffect, useState } from "react";
import { Selection } from "./Workspace";
import * as d3 from 'd3'
import { createPortal } from 'react-dom';
import { roundedHull } from "./roundedHull";

interface SelectionOverlayProps {
    selection: Selection
    highlight: boolean
    removeSelection: (id: string) => void
    setActiveSelection: (id: string) => void
    svgBackground: Element
}

/**
 * This component draws a hull around a given selection 
 * into the `svgBackground` prop.
 */
export const SelectionOverlay = ({
    selection,
    highlight,
    removeSelection,
    setActiveSelection,
    svgBackground }: SelectionOverlayProps) => {

    const [hullPoints, setHullPoints] = useState<[number, number][]>()

    useEffect(() => {
        // collect the points of the selection
        const points: [number, number][] =
            selection.refs
                .reduce((result, ref) => {
                    const el = document.querySelector(`[data-id='${ref}']`) as SVGGElement
                    if (!el) return result

                    const bbox = el.getBBox()
                    return [
                        ...result,
                        [bbox.x + 100, bbox.y + 100]
                    ] as [number, number][]
                }, [] as [number, number][])

        // build a hull around these points
        setHullPoints(points)
    }, [selection, removeSelection, setActiveSelection, svgBackground])

    return (
        <>
            {hullPoints && createPortal(
                <path
                    className={highlight ? 'hull-highlighted' : 'hull'}
                    d={roundedHull(hullPoints)}
                    onClick={(e) => {
                        if (e.altKey) removeSelection(selection.id)
                        else setActiveSelection(selection.id)
                    }} />,
                svgBackground
            )}
        </>
    )
}
