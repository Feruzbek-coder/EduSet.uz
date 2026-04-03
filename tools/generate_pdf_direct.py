import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from db_manager import DatabaseManager
from app import generate_wordsearch_pdf, generate_matching_pdf, generate_fillgaps_pdf, generate_multiplechoice_pdf, generate_crossword_pdf
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io, os, json

DB = DatabaseManager()
exs = DB.get_all_exercises()
if not exs:
    print('No exercises in DB')
    exit(1)

# pick first word_search or first
ws = [e for e in exs if e['type']=='word_search']
if ws:
    chosen = ws[0]
else:
    chosen = exs[0]

exercise = chosen
print('Generating for:', exercise['id'], exercise['title'], exercise['type'])

content = json.loads(exercise['content'])

# prepare doc
out_path = os.path.join(os.path.dirname(__file__), '..', 'generated_direct.pdf')
out_path = os.path.abspath(out_path)

doc = SimpleDocTemplate(out_path, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, spaceAfter=20, alignment=1)
word_style = ParagraphStyle('WordList', parent=styles['Normal'], fontSize=11, spaceAfter=5)

elements = []

if exercise['type']=='word_search':
    elements.extend(generate_wordsearch_pdf(exercise, content, title_style, word_style))
elif exercise['type']=='matching':
    elements.extend(generate_matching_pdf(exercise, content, title_style, word_style))
elif exercise['type']=='fill_gaps':
    elements.extend(generate_fillgaps_pdf(exercise, content, title_style, word_style))
elif exercise['type']=='multiple_choice':
    elements.extend(generate_multiplechoice_pdf(exercise, content, title_style, word_style))
elif exercise['type']=='crossword':
    elements.extend(generate_crossword_pdf(exercise, content, title_style, word_style))

if not elements:
    print('No elements generated')
    exit(1)

try:
    doc.build(elements)
    print('Saved PDF to', out_path)
except Exception as e:
    print('Error building PDF:', e)
    raise
