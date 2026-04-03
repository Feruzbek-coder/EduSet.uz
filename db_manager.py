import json
import os
import sys
from datetime import datetime

# ── PostgreSQL yoki SQLite avtomatik tanlov ───────────────────────────────────
# Railway PostgreSQL qo'shilganda DATABASE_URL env o'zgaruvchisini o'rnatadi.
# Agar DATABASE_URL mavjud bo'lsa → PostgreSQL (psycopg2)
# Aks holda → SQLite (lokal ishlab chiqish)

DATABASE_URL = os.environ.get('DATABASE_URL', '')
# Railway ba'zan postgres:// beradi, psycopg2 postgresql:// talab qiladi
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

try:
    import psycopg2
    import psycopg2.extras
    _HAS_PG = True
except ImportError:
    _HAS_PG = False

USE_PG = _HAS_PG and bool(DATABASE_URL)

if not USE_PG:
    import sqlite3


def get_base_path():
    """EXE yoki script uchun to'g'ri base path olish"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))


class DatabaseManager:
    def __init__(self, db_name='exercises.db'):
        self.use_pg = USE_PG
        if self.use_pg:
            self.db_url = DATABASE_URL
        else:
            db_env = os.environ.get('DB_PATH')
            if db_env:
                self.db_name = db_env
            else:
                base_path = get_base_path()
                self.db_name = os.path.join(base_path, db_name)
        self.init_db()

    # ── Ichki yordamchi metodlar ───────────────────────────────────────────────

    def _conn(self):
        """Tegishli DB ulanishini qaytaradi"""
        if self.use_pg:
            return psycopg2.connect(self.db_url, cursor_factory=psycopg2.extras.RealDictCursor)
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def _q(self, query):
        """PostgreSQL uchun %s, SQLite uchun ? placeholder"""
        if self.use_pg:
            return query
        return query.replace('%s', '?')

    @staticmethod
    def _ts(val):
        """datetime ob'ektni stringga o'tkazish"""
        if val is None:
            return ''
        if isinstance(val, datetime):
            return val.strftime('%Y-%m-%d %H:%M:%S')
        return str(val)

    # ── DB initsializatsiyasi ──────────────────────────────────────────────────

    def init_db(self):
        """Jadvallarni yaratish / migration"""
        conn = self._conn()
        cursor = conn.cursor()

        if self.use_pg:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exercises (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    user_id TEXT,
                    is_public INTEGER DEFAULT 0,
                    grade TEXT DEFAULT '',
                    subject TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    type TEXT NOT NULL,
                    text TEXT NOT NULL,
                    page TEXT,
                    username TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # Migration: ustunalar yo'q bo'lsa qo'shish
            for col, defn in [('grade', "TEXT DEFAULT ''"), ('subject', "TEXT DEFAULT ''")]:
                try:
                    cursor.execute(f'ALTER TABLE exercises ADD COLUMN IF NOT EXISTS {col} {defn}')
                except Exception:
                    pass
        else:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exercises (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    user_id TEXT,
                    is_public INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS vocabularies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    words TEXT NOT NULL,
                    user_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    text TEXT NOT NULL,
                    page TEXT,
                    username TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            for stmt in [
                'ALTER TABLE exercises ADD COLUMN user_id TEXT',
                'ALTER TABLE exercises ADD COLUMN is_public INTEGER DEFAULT 0',
                'ALTER TABLE vocabularies ADD COLUMN user_id TEXT',
                'ALTER TABLE exercises ADD COLUMN grade TEXT DEFAULT ""',
                'ALTER TABLE exercises ADD COLUMN subject TEXT DEFAULT ""',
            ]:
                try:
                    cursor.execute(stmt)
                except Exception:
                    pass

        conn.commit()
        conn.close()

    # ── Feedback metodlari ────────────────────────────────────────────────────

    def save_feedback(self, feedback_type, text, page='', username=''):
        """Foydalanuvchi fikr-taklifini saqlash"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute(
            self._q('INSERT INTO feedback (type, text, page, username) VALUES (%s, %s, %s, %s)'),
            (feedback_type, text, page, username)
        )
        conn.commit()
        conn.close()

    def get_all_feedback(self):
        """Barcha fikr-takliflarni olish (admin uchun)"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM feedback ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        result = []
        for r in rows:
            d = dict(r)
            d['created_at'] = self._ts(d.get('created_at', ''))
            result.append(d)
        return result

    def delete_feedback(self, feedback_id):
        """Bitta fikrni o'chirish"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute(self._q('DELETE FROM feedback WHERE id = %s'), (feedback_id,))
        conn.commit()
        conn.close()

    # ── Exercise metodlari ────────────────────────────────────────────────────

    def save_exercise(self, title, exercise_type, content, user_id=None, is_public=0, grade='', subject=''):
        """Mashqni saqlash"""
        conn = self._conn()
        cursor = conn.cursor()
        content_json = json.dumps(content, ensure_ascii=False)

        if self.use_pg:
            cursor.execute(
                'INSERT INTO exercises (title, type, content, user_id, is_public, grade, subject) '
                'VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id',
                (title, exercise_type, content_json, user_id, is_public, grade, subject)
            )
            exercise_id = cursor.fetchone()['id']
        else:
            cursor.execute(
                self._q('INSERT INTO exercises (title, type, content, user_id, is_public, grade, subject) '
                        'VALUES (%s, %s, %s, %s, %s, %s, %s)'),
                (title, exercise_type, content_json, user_id, is_public, grade, subject)
            )
            exercise_id = cursor.lastrowid

        conn.commit()
        conn.close()
        return exercise_id

    def get_all_exercises(self, user_id=None):
        """Barcha mashqlarni olish"""
        conn = self._conn()
        cursor = conn.cursor()

        if user_id:
            cursor.execute(
                self._q('SELECT * FROM exercises WHERE user_id = %s OR user_id IS NULL ORDER BY created_at DESC'),
                (user_id,)
            )
        else:
            cursor.execute('SELECT * FROM exercises ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()

        exercises = []
        for row in rows:
            r = dict(row)
            exercises.append({
                'id': r['id'],
                'title': r['title'],
                'type': r['type'],
                'content': r['content'],
                'user_id': r.get('user_id'),
                'is_public': r.get('is_public', 0),
                'grade': r.get('grade') or '',
                'subject': r.get('subject') or '',
                'created_at': self._ts(r.get('created_at', ''))
            })
        return exercises

    def get_public_exercises(self):
        """Umumiy (public) mashqlarni olish"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM exercises WHERE is_public = 1 ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()

        exercises = []
        for row in rows:
            r = dict(row)
            exercises.append({
                'id': r['id'],
                'title': r['title'],
                'type': r['type'],
                'content': r['content'],
                'user_id': r.get('user_id'),
                'is_public': r.get('is_public', 0),
                'grade': r.get('grade') or '',
                'subject': r.get('subject') or '',
                'created_at': self._ts(r.get('created_at', ''))
            })
        return exercises

    def get_exercise(self, exercise_id):
        """Bitta mashqni olish"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute(self._q('SELECT * FROM exercises WHERE id = %s'), (exercise_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            r = dict(row)
            return {
                'id': r['id'],
                'title': r['title'],
                'type': r['type'],
                'content': r['content'],
                'user_id': r.get('user_id'),
                'is_public': r.get('is_public', 0),
                'grade': r.get('grade') or '',
                'subject': r.get('subject') or '',
                'created_at': self._ts(r.get('created_at', ''))
            }
        return None

    def delete_exercise(self, exercise_id):
        """Mashqni o'chirish"""
        conn = self._conn()
        cursor = conn.cursor()
        cursor.execute(self._q('DELETE FROM exercises WHERE id = %s'), (exercise_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def update_exercise(self, exercise_id, title, content, grade='', subject=''):
        """Mashqni yangilash"""
        conn = self._conn()
        cursor = conn.cursor()
        content_json = json.dumps(content, ensure_ascii=False)
        cursor.execute(
            self._q('UPDATE exercises SET title = %s, content = %s, grade = %s, subject = %s WHERE id = %s'),
            (title, content_json, grade, subject, exercise_id)
        )
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def get_exercises_by_type(self, exercise_type, user_id=None):
        """Ma'lum turdagi mashqlarni olish"""
        conn = self._conn()
        cursor = conn.cursor()

        if user_id:
            cursor.execute(
                self._q('SELECT * FROM exercises WHERE type = %s AND (user_id = %s OR user_id IS NULL) ORDER BY created_at DESC'),
                (exercise_type, user_id)
            )
        else:
            cursor.execute(
                self._q('SELECT * FROM exercises WHERE type = %s ORDER BY created_at DESC'),
                (exercise_type,)
            )
        rows = cursor.fetchall()
        conn.close()

        exercises = []
        for row in rows:
            r = dict(row)
            exercises.append({
                'id': r['id'],
                'title': r['title'],
                'type': r['type'],
                'content': r['content'],
                'user_id': r.get('user_id'),
                'is_public': r.get('is_public', 0),
                'grade': r.get('grade') or '',
                'subject': r.get('subject') or '',
                'created_at': self._ts(r.get('created_at', ''))
            })
        return exercises

    def get_exercises_count_by_type(self, user_id=None):
        """Har bir turdagi mashqlar sonini olish"""
        conn = self._conn()
        cursor = conn.cursor()

        if user_id:
            cursor.execute(
                self._q('SELECT type, COUNT(*) as count FROM exercises '
                        'WHERE (user_id = %s OR user_id IS NULL) GROUP BY type'),
                (user_id,)
            )
        else:
            cursor.execute('SELECT type, COUNT(*) as count FROM exercises GROUP BY type')
        rows = cursor.fetchall()
        conn.close()

        counts = {
            'matching': 0,
            'fill_gaps': 0,
            'multiple_choice': 0,
            'word_search': 0,
            'crossword': 0
        }
        for row in rows:
            r = dict(row)
            if r['type'] in counts:
                counts[r['type']] = r['count']
        return counts