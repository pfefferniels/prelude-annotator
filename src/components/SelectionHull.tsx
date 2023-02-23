import React, { useContext, useEffect, useState } from "react";
import { Selection } from "../types/Selection";
import { createPortal } from 'react-dom';
import { roundedHull } from "../helpers/roundedHull";
import { UrlString } from "@inrupt/solid-client";
import { AnalysisContext } from "../context/AnalysisContext";

interface SelectionOverlayProps {
    selection: Selection
    highlight: boolean
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
                    const el = document.querySelector(`[data-id='${ref}']`) as SVGGElement
                    if (!el) return result

                    const systemId = el.closest('.system')?.getAttribute('data-id') || ''

                    // start a new hull right in the beginning or
                    // once we change the system
                    if (result.length === 0 || systemId !== result.at(-1)?.systemId) {
                        result.push({
                            points: [],
                            systemId: systemId
                        } as Hull)
                    }

                    const currentHull = result.at(-1)!

                    const bbox = el.getBBox()
                    currentHull.points = [
                        ...currentHull.points,
                        [bbox.x + 100, bbox.y + 100]
                    ]

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
                            fill={color}
                            className={`hull ${highlight ? 'hull-highlighted' : ''}`}
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
