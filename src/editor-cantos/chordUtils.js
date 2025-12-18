const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function normalize(note) {
    return note.replace("Db", "C#")
        .replace("Eb", "D#")
        .replace("Gb", "F#")
        .replace("Ab", "G#")
        .replace("Bb", "A#");
}

export function transposeChord(chord, semitones) {
    const match = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chord;

    const [, root, suffix] = match;
    const norm = normalize(root);
    const idx = NOTES_SHARP.indexOf(norm);
    if (idx === -1) return chord;

    const next = (idx + semitones + 12) % 12;
    return NOTES_SHARP[next] + suffix;
}

export function transposeText(text, semitones) {
    return text.replace(
        /\b([A-G][#b]?(?:m|min|maj|dim|aug)?\d*(?:sus\d)?(?:\/[A-G][#b]?)?)\b/g,
        (m) => transposeChord(m, semitones)
    );
}
