// transcriber.js
// MusanTranscriber - Professional Music Theory-Aware Staff to Solfa Converter

const Tesseract = require('tesseract.js');
const { fromPath } = require('pdf2pic');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Professional music structure and theory
const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]; // Relative semitone steps
const SOLFA_SYLLABLES = ['do', 're', 'mi', 'fa', 'so', 'la', 'ti'];

// Keys and their accidentals for reference (enharmonic equivalents included)
const KEY_SIGNATURES = {
  'C': [],
  'G': ['F#'],
  'D': ['F#', 'C#'],
  'A': ['F#', 'C#', 'G#'],
  'E': ['F#', 'C#', 'G#', 'D#'],
  'B': ['F#', 'C#', 'G#', 'D#', 'A#'],
  'F#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'],
  'C#': ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'],
  'F': ['Bb'],
  'Bb': ['Bb', 'Eb'],
  'Eb': ['Bb', 'Eb', 'Ab'],
  'Ab': ['Bb', 'Eb', 'Ab', 'Db'],
  'Db': ['Bb', 'Eb', 'Ab', 'Db', 'Gb'],
  'Gb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
  'Cb': ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']
};

function getEnharmonic(note) {
  const enharmonics = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'Cb': 'B', 'Fb': 'E', 'E#': 'F', 'B#': 'C'
  };
  return enharmonics[note] || note;
}

function buildScale(key) {
  const root = getEnharmonic(key);
  const startIndex = CHROMATIC_SCALE.indexOf(root);
  if (startIndex === -1) throw new Error(`Invalid key: ${key}`);
  
  const scale = MAJOR_SCALE_INTERVALS.map(i => CHROMATIC_SCALE[(startIndex + i) % 12]);
  const solfaMap = {};
  scale.forEach((note, idx) => {
    solfaMap[note] = SOLFA_SYLLABLES[idx];
  });
  return solfaMap;
}

function normalizeNote(note) {
  return getEnharmonic(note.replace('♯', '#').replace('♭', 'b'));
}

// Simulated music OCR output (replace with actual parser integration)
async function detectNotes(imagePath) {
  return [
    { note: 'G', accidental: '', octave: 4 },
    { note: 'A', accidental: '', octave: 4 },
    { note: 'B', accidental: '', octave: 4 },
    { note: 'C', accidental: '', octave: 5 },
    { note: 'D', accidental: '', octave: 5 }
  ];
}

async function extractText(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
  return text;
}

async function extractMusic(imagePath, key = 'C') {
  const notes = await detectNotes(imagePath);
  const solfaMap = buildScale(key);
  return notes.map(n => {
    const fullNote = normalizeNote(n.note + (n.accidental || ''));
    return solfaMap[fullNote] || `[${fullNote}]`;
  }).join(' ');
}

async function convertPdfToImage(pdfPath) {
  const outputPath = path.join(__dirname, 'temp.jpg');
  const convert = fromPath(pdfPath, { density: 200, saveFilename: 'page', savePath: './' });
  await convert(1);
  return 'page.jpg';
}

async function transcribe(filePath, key = 'C') {
  const ext = path.extname(filePath).toLowerCase();
  let imagePath = filePath;

  if (ext === '.pdf') {
    imagePath = await convertPdfToImage(filePath);
  }

  const text = await extractText(imagePath);
  const solfa = await extractMusic(imagePath, key);

  if (ext === '.pdf') fs.unlinkSync(imagePath);

  return `=== MUSAN TRANSCRIBER ===\nKey: ${key}\n\n=== SOLFA NOTATION ===\n${solfa}\n\n=== LYRICS / TEXT ===\n${text}`;
}

module.exports = { transcribe };
