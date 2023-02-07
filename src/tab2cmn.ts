
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
            keySig >= 2 ? { pname: 'd', accid: 's'} : { pname: 'e', accid: 'f' },
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

    const baroqueDMinorTuning = [ 65, 62, 57, 53, 50, 45, 43, 41, 40, 38, 36 ]

    console.log('mei=', mei)

    // update the staff notation MEI 
    // everytime the tablature MEI changes
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
        const pitch = baroqueDMinorTuning[+course - 1] + (+fret)
        const newNote = pitchToNote(pitch, -1)
        note.setAttribute('pname', newNote.pname)
        newNote.accid && note.setAttribute('accid', newNote.accid)
        newNote.oct && note.setAttribute('oct', newNote.oct.toString())
        note.removeAttribute('tab.course')
        note.removeAttribute('tab.fret')
    })

    return new XMLSerializer().serializeToString(meiDoc).replaceAll('tabGrp', 'chord')
}
