
/**
 * Converts the given tablature into standard music 
 * notation. 
 * @param mei MEI using the TabMEI module
 * @returns the transformed MEI in CMN
 */
export const tab2cmn = (mei: string) => {
    type Note = { pname: string, accid?: string, oct?: number }

    const pitchToNote = (p: number, keySig: number): Note => {
        let q = (p + 120) % 12
        const pitchNames: Note[] = [
            { pname: 'c' },
            keySig <= -3 ? { pname: 'd', accid: 'f' } : { pname: 'c', accid: 's' },
            { pname: 'd' },
            keySig >= 2 ? { pname: 'd', accid: 's' } : { pname: 'e', accid: 'f' },
            { pname: 'e' },
            { pname: 'f' },
            { pname: 'f', accid: 's' },
            { pname: 'g' },
            keySig <= -2 ? { pname: 'a', accid: 'f' } : { pname: 'g', accid: 's' },
            { pname: 'a' },
            { pname: 'b', accid: 'f' },
            { pname: 'b' }]
        const result = pitchNames[q]
        result.oct = Math.trunc(p / 12 - 1)
        return result
    }

    type Course = [number, number] | number

    const baroqueDMinorTuning: Course[] =
        [
            65,
            62,
            57,
            53,
            50,
            [45, 57],
            [43, 55],
            [41, 53],
            [40, 52],
            [38, 50],
            [36, 48]
        ]
    const baroqueGMinorTuning = []

    console.log('mei=', mei)

    const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')

    const staffDef = meiDoc.querySelector('staffDef')
    if (staffDef) {
        staffDef.setAttribute('meter.count', '1')
        staffDef.setAttribute('meter.unit', '8')
        staffDef.setAttribute('clef.line', '4')
        staffDef.setAttribute('clef.shape', 'F')
        staffDef.removeAttribute('notationtype')
        staffDef.setAttribute('lines', '5')
        const tuning = staffDef.querySelector('tuning')
        tuning && staffDef.removeChild(tuning)
    }

    meiDoc.querySelectorAll('note').forEach(note => {
        const course = note.getAttribute('tab.course')
        const fret = note.getAttribute('tab.fret')
        if (!course || !fret) {
            console.log('no @tab.course or @tab.fret attribute found')
            return
        }

        const correspCourse = baroqueDMinorTuning[+course - 1]
        const pitches =
            typeof correspCourse === 'number'
                ? [correspCourse + (+fret)]
                : [
                    correspCourse[0] + (+fret), // first string of the course
                    correspCourse[1] + (+fret) // second string of the course
                ]

        const newNoteElements = pitches.map((pitch, i) => {
            const newPitch = pitchToNote(pitch, -1)
            const newNoteEl = meiDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'note')

            // copy all attributes from the original <note>, except 
            // @tab.course and @tab.fret
            note.getAttributeNames()
                .filter(name => name !== 'tab.course' && name !== 'tab.fret')
                .forEach(name => {
                    newNoteEl.setAttribute(name, note.getAttribute(name)!)
                })

            newNoteEl.setAttribute('pname', newPitch.pname)
            newPitch.accid && newNoteEl.setAttribute('accid', newPitch.accid)
            newPitch.oct && newNoteEl.setAttribute('oct', newPitch.oct.toString())

            // display the octave string somewhat smaller
            i === 1 && newNoteEl.setAttribute('head.mod', 'paren')

            return newNoteEl
        })
        note.replaceWith(...newNoteElements)
    })

    return new XMLSerializer().serializeToString(meiDoc).replaceAll('tabGrp', 'chord')
}
