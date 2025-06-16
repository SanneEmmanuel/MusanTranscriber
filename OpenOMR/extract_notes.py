# extract_notes.py
import sys
from openomr import detect_notes  # adjust based on actual OpenOMR structure

if len(sys.argv) < 2:
    print("Usage: python extract_notes.py path/to/image")
    sys.exit(1)

image_path = sys.argv[1]
notes = detect_notes(image_path)  # should return a list of strings
print(','.join(notes))
