// transcriber.js
// MusanTranscriber by Dr Sanne Karibo - with OpenOMR Integration

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');
const { execFile } = require('child_process');

const ENHARMONIC_EQUIVS = {
  'B#': 'C', 'Cb': 'B',
  'E#': 'F', 'Fb': 'E',
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};

const MAJOR_SCALES = {
  'C':  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'G':  ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'D':  ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'A':  ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'E':  ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'B':  ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'F':  ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'Cb': ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']
};

const SOLFA = ['do', 're', 'mi', 'fa', 'so', 'la', 'ti'];

function normalizeNote(note) {
  return ENHARMONIC_EQUIVS[note] || note;
}

function mapNoteToSolfa(note, key) {
  const scale = MAJOR_SCALES[key];
  const index = scale.findIndex(n => normalizeNote(n) === normalizeNote(note));
  return index >= 0 ? SOLFA[index] : '?';
}

async function extractText(imagePath) {
  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m.status)
  });
  return result.data.text.trim();
}

async function convertPdfToImage(pdfPath) {
  const tempImagePath = `${pdfPath}.png`;
  const converter = fromPath(pdfPath, {
    density: 200,
    saveFilename: path.basename(tempImagePath, '.png'),
    savePath: path.dirname(tempImagePath),
    format: 'png'
  });
  const res = await converter(1); // first page
  return res.path;
}

function detectNotesWithPython(imagePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'OpenOMR/extract_notes.py');
    execFile('python3', [pythonScript, imagePath], (error, stdout, stderr) => {
      if (error) {
        console.error('Python OMR Error:', stderr);
        return reject(error);
      }
      const notes = stdout.trim().split(',');
      resolve(notes);
    });
  });
}

async function transcribe(filePath, key = 'C') {
  let workingPath = filePath;
  if (path.extname(filePath).toLowerCase() === '.pdf') {
    workingPath = await convertPdfToImage(filePath);
  }

  const lyrics = await extractText(workingPath);
  const notes = await detectNotesWithPython(workingPath);
  const solfa = notes.map(n => mapNoteToSolfa(n, key)).join(' - ');

  if (workingPath !== filePath) fs.unlinkSync(workingPath);

  return `Key: ${key}
Detected Notes: ${notes.join(', ')}
Solfa: ${solfa}
Lyrics/Text:\n${lyrics}`;
}

module.exports = { transcribe };
