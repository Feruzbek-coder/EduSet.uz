import sqlite3
import json
import os
import sys
from datetime import datetime

def get_base_path():
    """EXE yoki script uchun to'g'ri base path olish"""
    if getattr(sys, 'frozen', False):
        # PyInstaller EXE ichida
        return os.path.dirname(sys.executable)
    else:
        # Oddiy Python script
        return os.path.dirname(os.path.abspath(__file__))

class DatabaseManager:
    def __init__(self, db_name='exercises.db'):
        # Railway yoki boshqa serverda DB_PATH env o'zgaruvchisi orqali sozlash mumkin
        db_env = os.environ.get('DB_PATH')
        if db_env:
            self.db_name = db_env
        else:
            base_path = get_base_path()
            self.db_name = os.path.join(base_path, db_name)
        self.init_db()
    
    def init_db(self):
        """Ma'lumotlar bazasini yaratish"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
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

        # Mavjud jadvallar uchun migration (ustunlar yo'q bo'lsa qo'shish)
        try:
            cursor.execute('ALTER TABLE exercises ADD COLUMN user_id TEXT')
        except Exception:
            pass
        try:
            cursor.execute('ALTER TABLE exercises ADD COLUMN is_public INTEGER DEFAULT 0')
        except Exception:
            pass
        try:
            cursor.execute('ALTER TABLE vocabularies ADD COLUMN user_id TEXT')
        except Exception:
            pass
        try:
            cursor.execute('ALTER TABLE exercises ADD COLUMN grade TEXT DEFAULT ""')
        except Exception:
            pass
        try:
            cursor.execute('ALTER TABLE exercises ADD COLUMN subject TEXT DEFAULT ""')
        except Exception:
            pass

        # Feedback jadvali
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
        
        conn.commit()
        conn.close()

    def save_feedback(self, feedback_type, text, page='', username=''):
        """Foydalanuvchi fikr-taklifini saqlash"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO feedback (type, text, page, username) VALUES (?, ?, ?, ?)',
            (feedback_type, text, page, username)
        )
        conn.commit()
        conn.close()

    def get_all_feedback(self):
        """Barcha fikr-takliflarni olish (admin uchun)"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM feedback ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def delete_feedback(self, feedback_id):
        """Bitta fikrni o'chirish"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM feedback WHERE id = ?', (feedback_id,))
        conn.commit()
        conn.close()
    
    def save_exercise(self, title, exercise_type, content, user_id=None, is_public=0, grade='', subject=''):
        """Mashqni saqlash"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        content_json = json.dumps(content, ensure_ascii=False)
        
        cursor.execute('''
            INSERT INTO exercises (title, type, content, user_id, is_public, grade, subject)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (title, exercise_type, content_json, user_id, is_public, grade, subject))
        
        exercise_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return exercise_id
    
    def get_all_exercises(self, user_id=None):
        """Barcha mashqlarni olish (user_id berilsa o'sha foydalanuvchi + eski (NULL) yozuvlar)"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute(
                'SELECT * FROM exercises WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
                (user_id,)
            )
        else:
            cursor.execute('SELECT * FROM exercises ORDER BY created_at DESC')
        rows = cursor.fetchall()
        
        exercises = []
        for row in rows:
            exercises.append({
                'id': row['id'],
                'title': row['title'],
                'type': row['type'],
                'content': row['content'],
                'user_id': row['user_id'],
                'is_public': row['is_public'],
                'grade': row['grade'] if row['grade'] else '',
                'subject': row['subject'] if row['subject'] else '',
                'created_at': row['created_at']
            })
        
        conn.close()
        return exercises

    def get_public_exercises(self):
        """Umumiy (public) mashqlarni olish"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM exercises WHERE is_public = 1 ORDER BY created_at DESC')
        rows = cursor.fetchall()
        
        exercises = []
        for row in rows:
            exercises.append({
                'id': row['id'],
                'title': row['title'],
                'type': row['type'],
                'content': row['content'],
                'user_id': row['user_id'],
                'is_public': row['is_public'],
                'grade': row['grade'] if row['grade'] else '',
                'subject': row['subject'] if row['subject'] else '',
                'created_at': row['created_at']
            })
        
        conn.close()
        return exercises
    
    def get_exercise(self, exercise_id):
        """Bitta mashqni olish"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM exercises WHERE id = ?', (exercise_id,))
        row = cursor.fetchone()
        
        if row:
            exercise = {
                'id': row['id'],
                'title': row['title'],
                'type': row['type'],
                'content': row['content'],
                'user_id': row['user_id'],
                'is_public': row['is_public'],
                'created_at': row['created_at']
            }
        else:
            exercise = None
        
        conn.close()
        return exercise
    
    def delete_exercise(self, exercise_id):
        """Mashqni o'chirish"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM exercises WHERE id = ?', (exercise_id,))
        
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def update_exercise(self, exercise_id, title, content, grade='', subject=''):
        """Mashqni yangilash"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        content_json = json.dumps(content, ensure_ascii=False)
        
        cursor.execute('''
            UPDATE exercises 
            SET title = ?, content = ?, grade = ?, subject = ?
            WHERE id = ?
        ''', (title, content_json, grade, subject, exercise_id))
        
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def get_exercises_by_type(self, exercise_type, user_id=None):
        """Ma'lum turdagi mashqlarni olish"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute(
                'SELECT * FROM exercises WHERE type = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
                (exercise_type, user_id)
            )
        else:
            cursor.execute('SELECT * FROM exercises WHERE type = ? ORDER BY created_at DESC', (exercise_type,))
        rows = cursor.fetchall()
        
        exercises = []
        for row in rows:
            exercises.append({
                'id': row['id'],
                'title': row['title'],
                'type': row['type'],
                'content': row['content'],
                'user_id': row['user_id'],
                'is_public': row['is_public'],
                'created_at': row['created_at']
            })
        
        conn.close()
        return exercises
    
    def get_exercises_count_by_type(self, user_id=None):
        """Har bir turdagi mashqlar sonini olish"""
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute('''
                SELECT type, COUNT(*) as count 
                FROM exercises WHERE (user_id = ? OR user_id IS NULL)
                GROUP BY type
            ''', (user_id,))
        else:
            cursor.execute('''
                SELECT type, COUNT(*) as count 
                FROM exercises 
                GROUP BY type
            ''')
        rows = cursor.fetchall()
        
        counts = {
            'matching': 0,
            'fill_gaps': 0,
            'multiple_choice': 0,
            'word_search': 0,
            'crossword': 0
        }
        
        for row in rows:
            counts[row[0]] = row[1]
        
        conn.close()
        return counts