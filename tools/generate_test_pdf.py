from db_manager import DatabaseManager
from app import app
import json
import os

DB = DatabaseManager()
ex = DB.get_all_exercises()
if not ex:
    print('No exercises found in DB. Create one first.')
    exit(1)

# Prefer word_search exercises
ws_ids = [e['id'] for e in ex if e['type']=='word_search']
if ws_ids:
    ids = [ws_ids[0]]
else:
    # fallback: use first exercise
    ids = [ex[0]['id']]

print('Using exercise IDs:', ids)

client = app.test_client()
resp = client.post('/api/generate-pdf', json={'exercise_ids': ids})

if resp.status_code == 200 and resp.data:
    out_path = os.path.join(os.path.dirname(__file__), '..', 'generated_test.pdf')
    out_path = os.path.abspath(out_path)
    with open(out_path, 'wb') as f:
        f.write(resp.data)
    print('Saved PDF to', out_path)
else:
    print('Failed to generate PDF. Status:', resp.status_code)
    try:
        print('Response JSON:', resp.get_json())
    except Exception:
        print('Response data:', resp.data)
