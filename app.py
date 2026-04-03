from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response, send_file, session
from db_manager import DatabaseManager
import json
import socket
import subprocess
import sys
import os
import io
import base64
import random
import string
import uuid
from datetime import datetime

# PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Flowable, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


class GlowGridWrapper(Flowable):
    """CSS .ws-grid ga mos effekt: background #f8f9fa, border-radius 10px,
    box-shadow 0 4px 15px rgba(0,0,0,0.1), padding 10px."""
    def __init__(self, inner_flowable,
                 pad=3.5*mm,          # CSS padding: 10px
                 corner_r=3.5*mm,     # CSS border-radius: 10px
                 shadow_spread=5.3*mm, # CSS blur-radius: 15px
                 shadow_offset_y=1.4*mm): # CSS y-offset: 4px
        Flowable.__init__(self)
        self.inner = inner_flowable
        self.pad = pad
        self.corner_r = corner_r
        self.shadow_spread = shadow_spread
        self.shadow_offset_y = shadow_offset_y
        iw, ih = inner_flowable.wrap(0, 0)
        self.inner_w = iw
        self.inner_h = ih
        ss = shadow_spread
        soy = shadow_offset_y
        # Wrapper = inner + 2*pad + shadow space on all sides + extra bottom
        self.width  = iw + 2 * pad + 2 * ss
        self.height = ih + 2 * pad + 2 * ss + soy

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c    = self.canv
        pad  = self.pad
        ss   = self.shadow_spread
        soy  = self.shadow_offset_y
        cr   = self.corner_r

        # Background rect: centred inside wrapper, shifted up to leave room for shadow below
        bg_x = ss
        bg_y = ss + soy
        bg_w = self.inner_w + 2 * pad
        bg_h = self.inner_h + 2 * pad

        # Shadow centre: same as bg but shifted down by soy (towards page bottom)
        sx = bg_x          # x-offset = 0
        sy = bg_y - soy    # = ss  (down means lower y in ReportLab)

        # Simulate box-shadow blur: draw concentric rounded rects from outer to inner
        steps = 22
        for i in range(steps):
            t      = i / (steps - 1)          # 0=outermost, 1=innermost
            expand = ss * (1 - t)             # how much bigger than bg_rect
            # rgba(0,0,0,0.1) at the core, fades to 0 at edges
            alpha  = 0.10 * (t ** 1.4)
            gray   = 1.0 - alpha
            r      = max(cr, cr + expand * 0.4)
            c.setFillColorRGB(gray, gray, gray)
            c.roundRect(sx - expand, sy - expand,
                        bg_w + 2 * expand, bg_h + 2 * expand,
                        r, fill=1, stroke=0)

        # Draw background card: #f8f9fa with border-radius
        c.setFillColorRGB(0xf8/255, 0xf9/255, 0xfa/255)
        c.roundRect(bg_x, bg_y, bg_w, bg_h, cr, fill=1, stroke=0)

        # Draw inner table inside the padding
        self.inner.wrapOn(c, self.inner_w, self.inner_h)
        self.inner.drawOn(c, bg_x + pad, bg_y + pad)


def draw_page_border(canvas, doc):
    """Har bir sahifaga ikki qatorli chiroyli hoshiya chizish"""
    canvas.saveState()
    w, h = A4
    outer = 6 * mm
    inner = outer + 4 * mm

    # Tashqi chegara - qalin to'q ko'k
    canvas.setStrokeColor(colors.HexColor('#1a3a5c'))
    canvas.setLineWidth(2.8)
    canvas.rect(outer, outer, w - 2 * outer, h - 2 * outer)

    # Ichki chegara - ingichka yashil-ko'k
    canvas.setStrokeColor(colors.HexColor('#2980b9'))
    canvas.setLineWidth(1.0)
    canvas.rect(inner, inner, w - 2 * inner, h - 2 * inner)

    canvas.restoreState()

def check_port_available(port):
    """Port band yoki yo'qligini tekshirish"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result != 0  # True = port bo'sh

def kill_old_processes():
    """Eski DarsMashqlari.exe jarayonlarini to'xtatish"""
    if sys.platform == 'win32':
        try:
            # DarsMashqlari.exe jarayonlarini to'xtatish
            subprocess.run(['taskkill', '/F', '/IM', 'DarsMashqlari.exe'], 
                         capture_output=True, timeout=5)
        except:
            pass

def ensure_port_free(port):
    """Port bo'sh ekanligiga ishonch hosil qilish"""
    if not check_port_available(port):
        print(f"\n⚠️  OGOHLANTIRISH: Port {port} band!")
        print("🔍 Eski jarayonlarni to'xtatish urinilmoqda...")
        kill_old_processes()
        
        # Qayta tekshirish
        import time
        time.sleep(2)
        
        if not check_port_available(port):
            print(f"\n❌ XATOLIK: Port {port} hali ham band!")
            print("📋 Quyidagi buyruqlarni ishga tushiring:")
            print(f"   netstat -ano | findstr :{port}")
            print("   taskkill /F /PID <PID_RAQAMI>")
            print("\n💡 Yoki boshqa portda ishga tushiring:")
            print(f"   python app.py --port 5001")
            sys.exit(1)
        else:
            print("✅ Port muvaffaqiyatli bo'shatildi!")

def get_base_path():
    """EXE yoki script uchun to'g'ri base path olish"""
    if getattr(sys, 'frozen', False):
        # PyInstaller EXE ichida
        return sys._MEIPASS
    else:
        # Oddiy Python script
        return os.path.dirname(os.path.abspath(__file__))

base_path = get_base_path()
template_folder = os.path.join(base_path, 'templates')
static_folder = os.path.join(base_path, 'static')

app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Keshni o'chirish
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Template keshini o'chirish
app.config['SECRET_KEY'] = 'worksheetcreator-secret-2024'
app.jinja_env.auto_reload = True  # Jinja auto reload
db = DatabaseManager()

# PDF shriftlarini ro'yxatdan o'tkazish
try:
    # Windows shriftlar papkasi
    fonts_path = 'C:/Windows/Fonts'
    
    # Sitka Small Semibold
    sitka_path = os.path.join(fonts_path, 'SitkaSmall.ttc')
    if os.path.exists(sitka_path):
        pdfmetrics.registerFont(TTFont('SitkaSmall', sitka_path, subfontIndex=1))  # Semibold
    else:
        # Alternativ - Georgia Bold
        georgia_path = os.path.join(fonts_path, 'georgiab.ttf')
        if os.path.exists(georgia_path):
            pdfmetrics.registerFont(TTFont('SitkaSmall', georgia_path))
    
    # Cambria Bold Italic
    cambria_path = os.path.join(fonts_path, 'cambriaBI.ttf')
    if os.path.exists(cambria_path):
        pdfmetrics.registerFont(TTFont('CambriaBoldItalic', cambria_path))
    else:
        # Alternativ - Times Bold Italic
        cambria_path = os.path.join(fonts_path, 'timesbi.ttf')
        if os.path.exists(cambria_path):
            pdfmetrics.registerFont(TTFont('CambriaBoldItalic', cambria_path))
except Exception as e:
    print(f"Shrift ro'yxatdan o'tkazishda xatolik: {e}")

import time
@app.context_processor
def inject_cache_buster():
    return {'cache_version': int(time.time())}

# Barcha javoblarga no-cache header qo'shish
@app.after_request
def add_no_cache(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ─── User session yordamchi funksiya ────────────────────────────────────────
def get_current_user_id():
    """Joriy foydalanuvchi ID sini qaytaradi (yo'q bo'lsa None)"""
    return session.get('user_id')

def get_current_username():
    """Joriy foydalanuvchi nomini qaytaradi"""
    return session.get('username', '')

# ─── User session API ────────────────────────────────────────────────────────
@app.route('/api/user', methods=['GET'])
def get_user():
    """Joriy foydalanuvchi ma'lumotlarini qaytarish"""
    user_id = session.get('user_id')
    username = session.get('username', '')
    return jsonify({'user_id': user_id, 'username': username, 'logged_in': bool(user_id)})

@app.route('/api/user/set', methods=['POST'])
def set_user():
    """Foydalanuvchi nomini o'rnatish"""
    data = request.json or {}
    username = str(data.get('username', '')).strip()
    if not username:
        return jsonify({'success': False, 'error': 'Ism kiritilmagan'}), 400
    if len(username) > 50:
        return jsonify({'success': False, 'error': 'Ism juda uzun (max 50 belgi)'}), 400
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    session['username'] = username
    return jsonify({'success': True, 'user_id': session['user_id'], 'username': username})

@app.route('/api/user/logout', methods=['POST'])
def logout_user():
    """Foydalanuvchini chiqarish"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Domino uchun rasm yuklash — base64 qaytaradi"""
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'Fayl topilmadi'}), 400
    allowed = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed:
        return jsonify({'error': 'Noto\'g\'ri fayl turi'}), 400
    data = file.read()
    if len(data) > 5 * 1024 * 1024:
        return jsonify({'error': 'Fayl 5 MB dan katta'}), 400
    b64 = base64.b64encode(data).decode('utf-8')
    mime = f'image/{ext}' if ext != 'jpg' else 'image/jpeg'
    return jsonify({'success': True, 'data_url': f'data:{mime};base64,{b64}'})


@app.route('/')
def index():
    """Bosh sahifa - mashq turini tanlash"""
    return render_template('index.html', active_page='home')

@app.route('/animals')
def animals():
    """Hayvonlar rasmlari sahifasi"""
    return render_template('animals.html')

@app.route('/admin')
def admin():
    """Admin panel - foydalanuvchi o'z mashqlarini ko'rish"""
    user_id = get_current_user_id()
    exercises = db.get_all_exercises(user_id=user_id)
    return render_template('admin.html', exercises=exercises, active_page='admin')

@app.route('/create/<exercise_type>')
def create_exercise(exercise_type):
    """Mashq yaratish sahifasi"""
    return render_template('create.html', exercise_type=exercise_type, active_page='create')

@app.route('/api/save_exercise', methods=['POST'])
def save_exercise():
    """Mashqni saqlash"""
    data = request.json
    user_id = get_current_user_id()
    is_public = 1 if data.get('is_public') else 0
    exercise_id = db.save_exercise(
        title=data['title'],
        exercise_type=data['type'],
        content=data['content'],
        user_id=user_id,
        is_public=is_public,
        grade=data.get('grade', ''),
        subject=data.get('subject', '')
    )
    return jsonify({'success': True, 'id': exercise_id})

@app.route('/api/exercises')
def get_exercises():
    """Foydalanuvchining o'z mashqlarini olish"""
    user_id = get_current_user_id()
    exercises = db.get_all_exercises(user_id=user_id)
    return jsonify(exercises)

@app.route('/api/exercises/public')
def get_public_exercises_api():
    """Umumiy mashqlarni olish"""
    exercises = db.get_public_exercises()
    return jsonify(exercises)

@app.route('/api/exercise/<int:exercise_id>')
def get_exercise(exercise_id):
    """Bitta mashqni olish"""
    exercise = db.get_exercise(exercise_id)
    if exercise:
        return jsonify(exercise)
    return jsonify({'error': 'Mashq topilmadi'}), 404

@app.route('/exercise/<int:exercise_id>')
def exercise_page(exercise_id):
    """Mashqni bajarish sahifasi"""
    exercise = db.get_exercise(exercise_id)
    if not exercise:
        return redirect(url_for('index'))
    return render_template('exercise.html', exercise=exercise, active_page='exercise')

@app.route('/edit/<int:exercise_id>')
def edit_exercise(exercise_id):
    """Mashqni tahrirlash sahifasi"""
    exercise = db.get_exercise(exercise_id)
    if not exercise:
        return redirect(url_for('admin'))
    return render_template('create.html', 
                         exercise_type=exercise['type'], 
                         edit_mode=True, 
                         exercise=exercise,
                         active_page='admin')

@app.route('/api/update_exercise', methods=['POST'])
def update_exercise():
    """Mashqni yangilash"""
    data = request.json
    exercise_id = data.get('id')
    if not exercise_id:
        return jsonify({'success': False, 'error': 'ID topilmadi'}), 400
    
    success = db.update_exercise(
        exercise_id=exercise_id,
        title=data['title'],
        content=data['content'],
        grade=data.get('grade', ''),
        subject=data.get('subject', '')
    )
    return jsonify({'success': success})

@app.route('/exercises')
def exercises_categories():
    """Mashq turlari kategoriyalari - faqat o'z mashqlari"""
    user_id = get_current_user_id()
    counts = db.get_exercises_count_by_type(user_id=user_id)
    return render_template('categories.html', counts=counts, active_page='admin')

@app.route('/public-exercises')
def public_exercises():
    """Umumiy mashqlar sahifasi"""
    active_subject = request.args.get('subject', '').strip()
    exercises = db.get_public_exercises()

    # Fan bo'yicha filter
    if active_subject:
        exercises = [ex for ex in exercises if ex.get('subject', '') == active_subject]

    import json as _json
    for ex in exercises:
        try:
            c = _json.loads(ex['content']) if isinstance(ex['content'], str) else (ex['content'] or {})
        except Exception:
            c = {}
        words, grid = [], None
        t = ex['type']
        if t == 'word_search':
            raw = c.get('words', [])
            for w in raw[:8]:
                words.append(w.get('word', w) if isinstance(w, dict) else str(w))
            g = c.get('grid', [])
            if g:
                grid = [row[:10] for row in g[:10]]
        elif t == 'fill_gaps':
            for w in c.get('words', [])[:7]:
                words.append(w.get('answer', w.get('word', w)) if isinstance(w, dict) else str(w))
        elif t == 'matching':
            for item in c.get('items', [])[:5]:
                if isinstance(item, dict):
                    words.append((item.get('word',''), item.get('translation','')))
                else:
                    words.append((str(item), ''))
        elif t == 'find_pairings':
            for p in c.get('pairs', [])[:5]:
                words.append((p.get('english',''), p.get('uzbek','')))
        elif t == 'domino':
            for item in c.get('items', [])[:7]:
                words.append(item.get('word', '') if isinstance(item, dict) else str(item))
        elif t == 'crossword':
            for w in c.get('words', [])[:6]:
                words.append(w.get('word', '') if isinstance(w, dict) else str(w))
        ex['_preview_words'] = [w for w in words if w]
        ex['_preview_grid']  = grid
        ex['_preview_pairs'] = (ex['type'] in ('matching', 'find_pairings'))
    return render_template('public_exercises.html', exercises=exercises, active_page='community', active_subject=active_subject)

@app.route('/exercises/<exercise_type>')
def exercises_by_type(exercise_type):
    """Ma'lum turdagi mashqlar ro'yxati"""
    type_info = {
        'matching': {'name': 'Matching', 'icon': '🔗'},
        'fill_gaps': {'name': 'Fill in Gaps', 'icon': '✍️'},
        'multiple_choice': {'name': 'Multiple Choice', 'icon': '☑️'},  # kept for legacy display
        'word_search': {'name': 'Word Search', 'icon': '🔍'},
        'crossword': {'name': 'Crossword', 'icon': '✚'},
        'domino': {'name': 'Domino', 'icon': '🁣'},
        'find_pairings': {'name': 'Find Pairings', 'icon': '🃏'},
    }
    
    if exercise_type not in type_info:
        return redirect(url_for('exercises_categories'))
    
    user_id = get_current_user_id()
    exercises = db.get_exercises_by_type(exercise_type, user_id=user_id)
    return render_template('exercises_by_type.html', 
                         exercises=exercises, 
                         exercise_type=exercise_type,
                         type_name=type_info[exercise_type]['name'],
                         type_icon=type_info[exercise_type]['icon'],
                         active_page='admin')

@app.route('/api/delete_exercise/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """Mashqni o'chirish"""
    success = db.delete_exercise(exercise_id)
    return jsonify({'success': success})

@app.route('/worksheets')
def worksheets_redirect():
    """Worksheets PDF sahifasiga redirect"""
    return redirect(url_for('lesson_assistant'))

@app.route('/lesson-assistant')
def lesson_assistant():
    """Lesson Assistant - PDF yaratish sahifasi"""
    user_id = get_current_user_id()
    exercises = db.get_all_exercises(user_id=user_id)
    return render_template('lesson_assistant.html', exercises=exercises, active_page='pdf')

@app.route('/hujjatlar')
def hujjatlar():
    """Me'yoriy hujjatlar sahifasi"""
    return render_template('hujjatlar.html', active_page='hujjatlar')

def _normalize_apostrophe(text):
    """O'zbek apostrofi (ʻ, ', ', `) → ASCII ' ga almashtirish (Helvetica uchun)."""
    if not isinstance(text, str):
        return text
    for ch in ('\u02BB', '\u02BC', '\u2018', '\u2019', '\u201A', '\u0060'):
        text = text.replace(ch, "'")
    return text


@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Foydalanuvchi fikr-taklifini saqlash"""
    data = request.json or {}
    feedback_type = data.get('type', 'taklif')[:50]
    text = data.get('text', '')[:1000].strip()
    page = data.get('page', '')[:200]
    username = get_current_username()
    if text:
        db.save_feedback(feedback_type, text, page, username)
    return jsonify({'success': True})


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """Tanlangan mashqlardan PDF yaratish"""
    try:
        data = request.json
        exercise_ids = data.get('exercise_ids', [])

        if not exercise_ids:
            return jsonify({'error': 'Mashqlar tanlanmagan'}), 400

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                               leftMargin=5*mm, rightMargin=5*mm,
                               topMargin=5*mm, bottomMargin=5*mm)

        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ExerciseTitle', parent=styles['Heading1'],
            fontSize=18, textColor=colors.HexColor('#3498db'),
            spaceAfter=15, spaceBefore=10, alignment=1, fontName='Helvetica-Bold'
        )
        question_style = ParagraphStyle(
            'Question', parent=styles['Normal'],
            fontSize=11, spaceAfter=8, fontName='Helvetica-Bold'
        )
        answer_style = ParagraphStyle(
            'Answer', parent=styles['Normal'],
            fontSize=10, spaceAfter=5, leftIndent=20
        )

        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor('#888888'))
            canvas.drawCentredString(A4[0] / 2, 8*mm, 'eduset.uz')
            canvas.restoreState()

        for i, ex_id in enumerate(exercise_ids):
            exercise = db.get_exercise(ex_id)
            if not exercise:
                continue

            content = json.loads(exercise['content'])

            if exercise['type'] == 'word_search':
                ws_opts = content.get('pdf_options', {})
                elements.extend(generate_wordsearch_pdf(exercise, content, title_style, question_style, ws_opts))
            elif exercise['type'] == 'matching':
                elements.extend(generate_matching_pdf(exercise, content, title_style, question_style, answer_style))
            elif exercise['type'] == 'fill_gaps':
                elements.extend(generate_fillgaps_pdf(exercise, content, title_style, question_style, answer_style))
            elif exercise['type'] == 'multiple_choice':
                elements.extend(generate_multiplechoice_pdf(exercise, content, title_style, question_style, answer_style))
            elif exercise['type'] == 'crossword':
                elements.extend(generate_crossword_pdf(exercise, content, title_style, question_style))
            elif exercise['type'] == 'domino':
                elements.extend(generate_domino_pdf(exercise, content))
            elif exercise['type'] == 'find_pairings':
                elements.extend(generate_find_pairings_pdf(exercise, content))

            if i < len(exercise_ids) - 1:
                elements.append(PageBreak())

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        buffer.seek(0)

        return send_file(buffer, mimetype='application/pdf',
                         as_attachment=True, download_name='mashqlar.pdf')
    except Exception as e:
        import traceback
        print("PDF xatolik:", traceback.format_exc())
        return jsonify({'error': f'PDF yaratishda xatolik: {str(e)}'}), 500


def _build_pdf_elements(exercise_ids, pdf_options, styles):
    """PDF uchun barcha elementlarni yaratish (ikkala route ham uchun)"""
    title_style = ParagraphStyle(
        'ExerciseTitle', parent=styles['Heading1'],
        fontSize=18, textColor=colors.HexColor('#3498db'),
        spaceAfter=15, spaceBefore=10, alignment=1, fontName='Helvetica-Bold'
    )
    question_style = ParagraphStyle(
        'Question', parent=styles['Normal'],
        fontSize=11, spaceAfter=8, fontName='Helvetica-Bold'
    )
    answer_style = ParagraphStyle(
        'Answer', parent=styles['Normal'],
        fontSize=10, spaceAfter=5, leftIndent=20
    )

    elements = []
    total = len(exercise_ids)
    for i, ex_id in enumerate(exercise_ids):
        exercise = db.get_exercise(ex_id)
        if not exercise:
            continue
        content = json.loads(exercise['content'])
        ex_type = exercise['type']

        if ex_type == 'word_search':
            elements.extend(generate_wordsearch_pdf(exercise, content, title_style, question_style, pdf_options))
        elif ex_type == 'matching':
            elements.extend(generate_matching_pdf(exercise, content, title_style, question_style, answer_style))
        elif ex_type == 'fill_gaps':
            elements.extend(generate_fillgaps_pdf(exercise, content, title_style, question_style, answer_style))
        elif ex_type == 'multiple_choice':
            elements.extend(generate_multiplechoice_pdf(exercise, content, title_style, question_style, answer_style))
        elif ex_type == 'crossword':
            elements.extend(generate_crossword_pdf(exercise, content, title_style, question_style))
        elif ex_type == 'domino':
            elements.extend(generate_domino_pdf(exercise, content))
        elif ex_type == 'find_pairings':
            elements.extend(generate_find_pairings_pdf(exercise, content))

        if i < total - 1:
            elements.append(PageBreak())
    return elements


@app.route('/api/generate-pdf-download', methods=['POST', 'GET'])
def generate_pdf_download():
    """PDF yuklab olish — GET yoki POST"""
    if request.method == 'GET':
        ids_str = request.args.get('ids', '')
        exercise_ids = [int(x) for x in ids_str.split(',') if x.strip().isdigit()]
        pdf_options  = {}
    else:
        exercise_ids_raw = request.form.get('exercise_ids', '[]')
        pdf_options_raw  = request.form.get('pdf_options', '{}')
        try:
            exercise_ids = json.loads(exercise_ids_raw)
        except Exception:
            exercise_ids = []
        try:
            pdf_options = json.loads(pdf_options_raw)
        except Exception:
            pdf_options = {}
    if not exercise_ids:
        return "Mashqlar tanlanmagan", 400
    buffer   = io.BytesIO()
    doc      = SimpleDocTemplate(buffer, pagesize=A4,
                                 leftMargin=5*mm, rightMargin=5*mm,
                                 topMargin=5*mm, bottomMargin=5*mm)
    styles   = getSampleStyleSheet()
    elements = _build_pdf_elements(exercise_ids, pdf_options, styles)

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#888888'))
        canvas.drawCentredString(A4[0] / 2, 8*mm, 'eduset.uz')
        canvas.restoreState()

    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=worksheets.pdf'
    return response

def generate_domino_pdf(exercise, content):
    """Domino kartochkalar PDF — 3 ta ustun, har birida so'z+rasm"""
    from reportlab.platypus import Image as RLImage
    elements = []

    items = content.get('items', [])  # [{word, image_data}, ...]
    if not items:
        return elements

    # A4: 210x297mm, margin 10mm → usable 190x277mm
    page_w = 190 * mm
    cols   = 3
    gap    = 4 * mm
    card_w = (page_w - gap * (cols - 1)) / cols   # ~61mm
    card_h = card_w * 1.35                         # ~82mm (portrait)
    label_h = 14 * mm                              # word header height
    img_h   = card_h - label_h                     # image area

    # Build full list of cards: [label, image_data_or_None]
    cards = []
    cards.append(('START', items[0].get('image_data', '')))
    for idx in range(1, len(items)):
        cards.append((_normalize_apostrophe(items[idx - 1].get('word', '')).upper(),
                      items[idx].get('image_data', '')))
    cards.append((_normalize_apostrophe(items[-1].get('word', '')).upper(), None))  # THE END

    def make_card(label, img_data):
        """Return a Table that looks like the domino card in the screenshot."""
        # Label row
        is_start = (label == 'START')
        label_bg  = colors.HexColor('#FFFF00') if is_start else colors.white
        label_fg  = colors.HexColor('#0000CC')

        label_style = ParagraphStyle(
            'DominoLabel',
            fontName='Helvetica-Bold',
            fontSize=16 if is_start else 20,
            textColor=label_fg,
            alignment=1,
            leading=20,
        )
        label_para = Paragraph(label, label_style)

        # Image row
        if img_data and img_data.startswith('data:'):
            try:
                header, b64 = img_data.split(',', 1)
                raw = base64.b64decode(b64)
                img_buf = io.BytesIO(raw)
                img_elem = RLImage(img_buf, width=card_w - 4*mm, height=img_h - 4*mm,
                                   kind='proportional')
            except Exception:
                img_elem = Paragraph('', ParagraphStyle('x'))
        elif label.upper() == 'THE END':
            end_style = ParagraphStyle(
                'TheEnd', fontName='Helvetica-Bold', fontSize=18,
                textColor=colors.HexColor('#CC0000'), alignment=1, leading=22)
            img_elem = Paragraph('THE END', end_style)
        else:
            img_elem = Paragraph('', ParagraphStyle('x'))

        card_table = Table(
            [[label_para], [img_elem]],
            colWidths=[card_w],
            rowHeights=[label_h, img_h]
        )
        card_table.setStyle(TableStyle([
            ('BOX',           (0, 0), (-1, -1), 1.5, colors.HexColor('#555555')),
            ('LINEBELOW',     (0, 0), (-1, 0),  1.0, colors.HexColor('#555555')),
            ('BACKGROUND',    (0, 0), (-1, 0),  label_bg),
            ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING',    (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING',   (0, 0), (-1, -1), 2),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 2),
        ]))
        return card_table

    # Lay cards in rows of `cols`
    row_data = []
    for idx, (label, img_data) in enumerate(cards):
        row_data.append(make_card(label, img_data))
        if len(row_data) == cols:
            row_table = Table([row_data],
                              colWidths=[card_w] * cols,
                              rowHeights=[card_h],
                              hAlign='LEFT')
            row_table.setStyle(TableStyle([
                ('LEFTPADDING',   (0, 0), (-1, -1), gap / 2),
                ('RIGHTPADDING',  (0, 0), (-1, -1), gap / 2),
                ('TOPPADDING',    (0, 0), (-1, -1), gap / 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), gap / 2),
            ]))
            elements.append(row_table)
            elements.append(Spacer(1, gap))
            row_data = []

    # Remaining cards (partial last row) - pad with empty cells
    if row_data:
        while len(row_data) < cols:
            row_data.append(Spacer(card_w, card_h))
        row_table = Table([row_data],
                          colWidths=[card_w] * cols,
                          rowHeights=[card_h],
                          hAlign='LEFT')
        row_table.setStyle(TableStyle([
            ('LEFTPADDING',   (0, 0), (-1, -1), gap / 2),
            ('RIGHTPADDING',  (0, 0), (-1, -1), gap / 2),
            ('TOPPADDING',    (0, 0), (-1, -1), gap / 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), gap / 2),
        ]))
        elements.append(row_table)

    return elements


# Mavjud shrift nomlari (pdf uchun)
WS_FONTS = {
    'times':     ('Times-BoldItalic', 'Times-Bold'),
    'helvetica': ('Helvetica-BoldOblique', 'Helvetica-Bold'),
    'cambria':   ('CambriaBoldItalic', 'CambriaBoldItalic'),
    'sitka':     ('SitkaSmall', 'SitkaSmall'),
    'courier':   ('Courier-BoldOblique', 'Courier-Bold'),
}

def _resolve_word_font(font_key):
    """word list uchun font nomi"""
    pair = WS_FONTS.get(font_key, WS_FONTS['cambria'])
    return pair[0]

def _resolve_grid_font(font_key):
    """grid harflari uchun font nomi"""
    pair = WS_FONTS.get(font_key, WS_FONTS['sitka'])
    return pair[1]


def generate_wordsearch_pdf(exercise, content, title_style, question_style, pdf_options=None):
    """Word Search PDF yaratish — border rangi va word-list font tanlab bo'ladi"""
    if pdf_options is None:
        pdf_options = {}
    # Content ichidagi pdf_options ni ham qo'shamiz (fallback)
    for k, v in content.get('pdf_options', {}).items():
        if k not in pdf_options or not pdf_options[k]:
            pdf_options[k] = v

    border_color_hex = pdf_options.get('ws_border_color', '#e0e0e0')
    word_font_key    = pdf_options.get('ws_word_font', 'cambria')
    grid_font_key    = pdf_options.get('ws_grid_font', 'sitka')

    try:
        border_color = colors.HexColor(border_color_hex)
    except Exception:
        border_color = colors.HexColor('#e0e0e0')

    word_font = _resolve_word_font(word_font_key)
    grid_font = _resolve_grid_font(grid_font_key)

    elements = []

    grid = content.get('grid', [])
    words = content.get('words', [])

    doc_margin = 5 * mm
    available_width  = 210 * mm - 2 * doc_margin
    available_height = 297 * mm - 2 * doc_margin - 45 * mm

    _gw_pad = 3.5 * mm
    _gw_ss  = 5.3 * mm
    _gw_soy = 1.4 * mm
    wrapper_dw = 2 * (_gw_pad + _gw_ss)
    wrapper_dh = 2 * (_gw_pad + _gw_ss) + _gw_soy

    if grid:
        grid_size = len(grid)
        usable_w = available_width  - wrapper_dw
        usable_h = available_height - wrapper_dh
        cell_size = min(usable_w / grid_size, usable_h / grid_size)

        font_size = int(cell_size / mm * 0.72)
        font_size = max(15, min(32, font_size))

        table_data = [[cell.upper() for cell in row] for row in grid]

        inner_table = Table(
            table_data,
            colWidths=[cell_size] * grid_size,
            rowHeights=[cell_size] * grid_size,
            hAlign='CENTER'
        )
        inner_table.setStyle(TableStyle([
            ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME',   (0, 0), (-1, -1), grid_font),
            ('FONTSIZE',   (0, 0), (-1, -1), font_size),
            ('GRID',       (0, 0), (-1, -1), 0.5, border_color),
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('TEXTCOLOR',  (0, 0), (-1, -1), colors.HexColor('#333333')),
        ]))

        fading_grid = GlowGridWrapper(inner_table)
        centered = Table([[fading_grid]], colWidths=[available_width])
        centered.setStyle(TableStyle([
            ('ALIGN',         (0, 0), (0, 0), 'CENTER'),
            ('VALIGN',        (0, 0), (0, 0), 'TOP'),
            ('LEFTPADDING',   (0, 0), (0, 0), 0),
            ('RIGHTPADDING',  (0, 0), (0, 0), 0),
            ('TOPPADDING',    (0, 0), (0, 0), 0),
            ('BOTTOMPADDING', (0, 0), (0, 0), 0),
        ]))
        elements.append(centered)
        elements.append(Spacer(1, 18))

    if words:
        word_list = []
        for w in words:
            word = w.get('word', '') if isinstance(w, dict) else w
            word_list.append(_normalize_apostrophe(word).capitalize())

        word_cols = 5
        word_rows = (len(word_list) + word_cols - 1) // word_cols
        word_table_data = []
        for r in range(word_rows):
            row_data = []
            for c in range(word_cols):
                idx = r * word_cols + c
                row_data.append(word_list[idx] if idx < len(word_list) else '')
            word_table_data.append(row_data)

        if word_table_data:
            col_width = available_width / word_cols
            word_table = Table(word_table_data, colWidths=[col_width] * word_cols, hAlign='CENTER')
            word_table.setStyle(TableStyle([
                ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME',      (0, 0), (-1, -1), word_font),
                ('FONTSIZE',      (0, 0), (-1, -1), 18),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING',    (0, 0), (-1, -1), 10),
                ('TEXTCOLOR',     (0, 0), (-1, -1), colors.HexColor('#2c3e50')),
            ]))
            elements.append(word_table)

    return elements

# Screenshotdagi WORD_COLORS — har bir juftlik uchun rang
_MATCH_COLORS = [
    colors.HexColor('#1a3a6e'),  # to'q ko'k
    colors.HexColor('#1a6e2a'),  # yashil
    colors.HexColor('#b22222'),  # qizil
    colors.HexColor('#5b2d8e'),  # binafsha
    colors.HexColor('#b8601a'),  # to'q sariq-jigarrang
    colors.HexColor('#0077aa'),  # moviy
    colors.HexColor('#8e2d6e'),  # qo'ng'ir-binafsha
    colors.HexColor('#2d6e8e'),  # dengiz ko'ki
]

class RoundedWordBox(Flowable):
    """Skrinshottagi kabi rounded-corner kulrang fon ichida rangli qalin so'z"""
    def __init__(self, text, text_color, box_w, box_h, font_size=22):
        Flowable.__init__(self)
        self.text = text
        self.text_color = text_color
        self.box_w = box_w
        self.box_h = box_h
        self.font_size = font_size
        self.width = box_w
        self.height = box_h

    def wrap(self, aw, ah):
        return self.box_w, self.box_h

    def draw(self):
        c = self.canv
        w, h = self.box_w, self.box_h
        # Kulrang fon
        c.setFillColor(colors.HexColor('#d8d8d8'))
        c.roundRect(0, 0, w, h, 6*mm, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor('#aaaaaa'))
        c.setLineWidth(0.8)
        c.roundRect(0, 0, w, h, 6*mm, fill=0, stroke=1)
        # So'z matni
        c.setFillColor(self.text_color)
        c.setFont('Helvetica-Bold', self.font_size)
        text_w = c.stringWidth(self.text, 'Helvetica-Bold', self.font_size)
        x = (w - text_w) / 2
        y = (h - self.font_size * 0.7) / 2
        c.drawString(x, y, self.text)


def generate_matching_pdf(exercise, content, title_style, question_style, answer_style):
    """Matching PDF — sariq fon, katta harflar, 2 ustun, rangli so'zlar"""
    elements = []

    items = content.get('items', [])
    if not items:
        return elements

    n = len(items)
    page_h = 297 * mm
    margin = 20 * mm
    bg_pad = 10 * mm
    usable_h = page_h - 2 * margin - 2 * bg_pad

    row_gap = 5 * mm
    box_h = min(20 * mm, (usable_h - (n - 1) * row_gap) / n)
    box_h = max(14 * mm, box_h)
    font_sz = max(22, min(36, int(box_h / mm * 1.2)))

    inner_w = 185 * mm
    col_w = inner_w * 0.43
    gap_w = inner_w - 2 * col_w

    # O'ng ustun uchun aralashtirilgan nusxa
    right_items = list(items)
    random.shuffle(right_items)

    table_data = []
    for i in range(n):
        color = _MATCH_COLORS[i % len(_MATCH_COLORS)]
        right_item = right_items[i]
        right_color = _MATCH_COLORS[items.index(right_item) % len(_MATCH_COLORS)]
        left_box  = RoundedWordBox(items[i].get('word', ''),  color,       col_w, box_h, font_sz)
        right_box = RoundedWordBox(right_item.get('match', ''), right_color, col_w, box_h, font_sz)
        table_data.append([left_box, '', right_box])

    inner_table = Table(
        table_data,
        colWidths=[col_w, gap_w, col_w],
        rowHeights=[box_h + row_gap] * n,
        hAlign='CENTER'
    )
    inner_table.setStyle(TableStyle([
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))

    wrapper = _ColoredBgWrapper(inner_table, bg_color='#ffffd6', border_color='#d4c870',
                                pad=bg_pad, corner_r=6*mm)

    centered = Table([[wrapper]], colWidths=[200*mm])
    centered.setStyle(TableStyle([
        ('ALIGN',        (0,0), (0,0), 'CENTER'),
        ('VALIGN',       (0,0), (0,0), 'TOP'),
        ('LEFTPADDING',  (0,0), (0,0), 0),
        ('RIGHTPADDING', (0,0), (0,0), 0),
    ]))
    elements.append(centered)

    return elements

def generate_fillgaps_pdf(exercise, content, title_style, question_style, answer_style):
    """Fill in Gaps PDF — sariq fon, rangli harflar, avtomatik gap yaratish"""
    elements = []

    words_list = content.get('words', [])
    if not words_list:
        return elements

    n = len(words_list)
    page_h = 297 * mm
    margin = 20 * mm
    bg_pad = 10 * mm
    usable_h = page_h - 2 * margin - 2 * bg_pad

    row_gap = 7 * mm
    row_h = min(26 * mm, (usable_h - (n - 1) * row_gap) / n)
    row_h = max(18 * mm, row_h)
    font_sz = max(26, min(40, int(row_h / mm * 1.1)))

    avail_w = 180 * mm

    row_flowables = []
    for i, word_item in enumerate(words_list):
        answer = word_item.get('answer', word_item.get('word', ''))
        answer = _normalize_apostrophe(answer)
        clean_answer = answer.replace('_', '').replace(' ', '').strip()
        if not clean_answer:
            continue

        gap_display = _make_gap_display(clean_answer)
        color = _MATCH_COLORS[i % len(_MATCH_COLORS)]
        row_el = _FillGapRow(gap_display + '  -', clean_answer, color, avail_w, row_h, font_sz)
        row_flowables.append(row_el)

    if not row_flowables:
        return elements

    table_data = [[f] for f in row_flowables]
    inner_table = Table(
        table_data,
        colWidths=[avail_w],
        rowHeights=[row_h + row_gap] * len(row_flowables),
        hAlign='LEFT'
    )
    inner_table.setStyle(TableStyle([
        ('LEFTPADDING',   (0,0), (-1,-1), 0),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('TOPPADDING',    (0,0), (-1,-1), int(row_gap/2)),
        ('BOTTOMPADDING', (0,0), (-1,-1), int(row_gap/2)),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))

    wrapper = _ColoredBgWrapper(inner_table, bg_color='#fffff0', border_color='#4a9e5c',
                                pad=bg_pad, corner_r=6*mm)

    centered = Table([[wrapper]], colWidths=[200*mm])
    centered.setStyle(TableStyle([
        ('ALIGN',        (0,0), (0,0), 'CENTER'),
        ('VALIGN',       (0,0), (0,0), 'TOP'),
        ('LEFTPADDING',  (0,0), (0,0), 0),
        ('RIGHTPADDING', (0,0), (0,0), 0),
    ]))
    elements.append(centered)

    return elements


class _FillGapRow(Flowable):
    """Bitta fill-gap qatori: rangli matn + tire + uzun chiziq"""
    def __init__(self, text_part, answer, text_color, row_w, row_h, font_sz):
        Flowable.__init__(self)
        self.text_part  = text_part
        self.answer     = answer
        self.text_color = text_color
        self.row_w      = row_w
        self.row_h      = row_h
        self.font_sz    = font_sz
        self.width      = row_w
        self.height     = row_h

    def wrap(self, aw, ah):
        return self.row_w, self.row_h

    def draw(self):
        c = self.canv
        fz = self.font_sz
        c.setFont('Helvetica-Bold', fz)
        c.setFillColor(self.text_color)
        y_text = (self.row_h - fz * 0.7) / 2
        c.drawString(0, y_text, self.text_part)
        # Tirnoq chizig'i — answer uchun uzun chiziq
        text_w = c.stringWidth(self.text_part, 'Helvetica-Bold', fz)
        line_x_start = text_w + 4 * mm
        line_x_end   = self.row_w - 5 * mm
        line_y = y_text + fz * 0.18
        c.setStrokeColor(self.text_color)
        c.setLineWidth(1.5)
        if line_x_end > line_x_start:
            c.line(line_x_start, line_y, line_x_end, line_y)


class _ColoredBgWrapper(Flowable):
    """Inner flowable atrofida rangli fon bilan rounded rect chizadi."""
    def __init__(self, inner_flowable, bg_color='#fffff0', border_color='#d0d0a0',
                 pad=8*mm, corner_r=5*mm, border_width=1.5):
        Flowable.__init__(self)
        self.inner = inner_flowable
        self.bg_hex = bg_color
        self.border_hex = border_color
        self.pad = pad
        self.corner_r = corner_r
        self.border_width = border_width
        iw, ih = inner_flowable.wrap(0, 0)
        self.inner_w = iw
        self.inner_h = ih
        self.width = iw + 2 * pad
        self.height = ih + 2 * pad

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        p = self.pad
        cr = self.corner_r
        w, h = self.width, self.height
        c.setFillColor(colors.HexColor(self.bg_hex))
        c.setStrokeColor(colors.HexColor(self.border_hex))
        c.setLineWidth(self.border_width)
        c.roundRect(0, 0, w, h, cr, fill=1, stroke=1)
        self.inner.wrapOn(c, self.inner_w, self.inner_h)
        self.inner.drawOn(c, p, p)


def _make_gap_display(full_word):
    """So'zdan avtomatik gap yaratish: <=3 harf -> 1 gap, >=4 harf -> 2 gap"""
    n = len(full_word)
    if n <= 1:
        return full_word
    n_gaps = 1 if n <= 3 else 2
    positions = sorted(random.sample(range(n), min(n_gaps, n)))
    parts = []
    for i, ch in enumerate(full_word):
        if i in positions:
            parts.append('__')
        else:
            parts.append(ch)
    return ' '.join(parts)


def generate_multiplechoice_pdf(exercise, content, title_style, question_style, answer_style):
    """Multiple Choice PDF yaratish - chiroyli ko'rinish"""
    elements = []
    
    elements.append(Paragraph(f"☑️ Multiple Choice: {exercise['title']}", title_style))
    elements.append(Paragraph("<i>To'g'ri javobni tanlang</i>", answer_style))
    elements.append(Spacer(1, 15))
    
    questions = content.get('questions', [])
    
    question_para_style = ParagraphStyle('MCQuestion', parent=question_style, fontSize=13, leading=18, textColor=colors.HexColor('#2c3e50'))
    option_para_style = ParagraphStyle('MCOption', parent=answer_style, fontSize=11, leading=16, leftIndent=20)
    
    for i, q in enumerate(questions, 1):
        elements.append(Paragraph(f"<b>{i}. {q.get('question', '')}</b>", question_para_style))
        elements.append(Spacer(1, 6))
        
        options = q.get('options', [])
        for j, opt in enumerate(options):
            letter = chr(65 + j)  # A, B, C, D
            elements.append(Paragraph(f"<b>{letter})</b> {opt}", option_para_style))
        
        elements.append(Spacer(1, 12))
    
    return elements

class _CrosswordPage(Flowable):
    """Butun crossword sahifasini bitta Flowable sifatida chizadi — 100% 1 sahifa."""
    def __init__(self, grid_table, grid_w_pt, grid_h_pt, clue_table, clue_w_pt, clue_h_pt,
                 wrapper_pad, total_w, total_h, spacer_h):
        Flowable.__init__(self)
        self.grid_table = grid_table
        self.grid_w_pt  = grid_w_pt
        self.grid_h_pt  = grid_h_pt
        self.clue_table = clue_table
        self.clue_w_pt  = clue_w_pt
        self.clue_h_pt  = clue_h_pt
        self.wpad       = wrapper_pad
        self.spacer_h   = spacer_h
        self.width       = total_w
        self.height      = total_h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        # Grid wrapper background + border
        gww = self.grid_w_pt + 2 * self.wpad
        gwh = self.grid_h_pt + 2 * self.wpad
        gx  = (self.width - gww) / 2         # markazlash
        gy  = self.height - gwh               # yuqoridan boshlab
        c.saveState()
        c.setFillColor(colors.HexColor('#e8e8e8'))
        c.setStrokeColor(colors.HexColor('#cccccc'))
        c.setLineWidth(0.3)
        c.roundRect(gx, gy, gww, gwh, 3*mm, fill=1, stroke=1)
        c.restoreState()
        # Grid table
        self.grid_table.wrapOn(c, self.grid_w_pt, self.grid_h_pt)
        self.grid_table.drawOn(c, gx + self.wpad, gy + self.wpad)
        # Clue table — sahifaning pastiga joylash
        if self.clue_table:
            clue_y = 0
            self.clue_table.wrapOn(c, self.width, self.clue_h_pt)
            self.clue_table.drawOn(c, 0, clue_y)


def generate_crossword_pdf(exercise, content, title_style, question_style):
    """Crossword PDF — har doim 1 sahifa. Bitta Flowable ichida chiziladi."""
    elements = []

    grid_raw   = content.get('grid', [])
    words_data = content.get('words', [])
    numbered   = content.get('numberedCells', [])

    if not grid_raw:
        return elements

    # --- Grid normallashtirish ---
    grid = []
    for row in grid_raw:
        new_row = []
        for cell in row:
            if cell is None or cell == 'null' or cell == '':
                new_row.append('#')
            else:
                new_row.append(str(cell))
        grid.append(new_row)

    rows_n = len(grid)
    cols_n = max(len(r) for r in grid) if grid else 0
    for row in grid:
        while len(row) < cols_n:
            row.append('#')

    # Frame padding (6pt*2) + footer (8mm) + xavfsizlik marginni hisobga olish
    usable_h = 270 * mm    # real ishchi balandlik (287 - ~17mm overhead)
    avail_w  = 196 * mm    # real ishchi kenglik
    gpad     = 2 * mm
    spacer_h = 3 * mm

    across = sorted([w for w in (words_data or []) if w.get('direction') == 'across'],
                    key=lambda w: w.get('number', 99))
    down   = sorted([w for w in (words_data or []) if w.get('direction') == 'down'],
                    key=lambda w: w.get('number', 99))

    # ── Clue jadval quruvchi ──
    def build_clue(fsz):
        ts = ParagraphStyle('CT', parent=question_style, fontSize=fsz+2,
                            textColor=colors.white, fontName='Helvetica-Bold',
                            leading=fsz+4, spaceAfter=0)
        ns = ParagraphStyle('CN', parent=question_style, fontSize=fsz,
                            fontName='Helvetica-Bold', textColor=colors.HexColor('#2c3e50'),
                            alignment=2, leading=fsz+3, spaceAfter=0)
        cs = ParagraphStyle('CC', parent=question_style, fontSize=fsz,
                            fontName='Helvetica', textColor=colors.HexColor('#34495e'),
                            leading=fsz+3, spaceAfter=0)
        bw  = avail_w * 0.47
        nw  = 18 * mm
        tw  = bw - nw

        def box(title, items, hc):
            rr = [[Paragraph(f'<b>{title}</b>', ts), '']]
            for w in items:
                rr.append([Paragraph(f'<b>{w.get("number","")}.</b>', ns),
                           Paragraph(_normalize_apostrophe(w.get('clue', w.get('word', ''))), cs)])
            t = Table(rr, colWidths=[nw, tw])
            t.setStyle(TableStyle([
                ('SPAN',           (0,0),(1,0)),
                ('BACKGROUND',     (0,0),(1,0), colors.HexColor(hc)),
                ('TOPPADDING',     (0,0),(1,0), 4),
                ('BOTTOMPADDING',  (0,0),(1,0), 4),
                ('LEFTPADDING',    (0,0),(1,0), 8),
                ('VALIGN',         (0,0),(-1,-1), 'MIDDLE'),
                ('TOPPADDING',     (0,1),(-1,-1), 1),
                ('BOTTOMPADDING',  (0,1),(-1,-1), 1),
                ('LEFTPADDING',    (0,1),(-1,-1), 3),
                ('RIGHTPADDING',   (0,1),(-1,-1), 3),
                ('ROWBACKGROUNDS', (0,1),(-1,-1),
                 [colors.HexColor('#f8f8f8'), colors.white]),
                ('LINEBELOW',      (0,0),(1,0), 0.5, colors.HexColor(hc)),
                ('BOX',            (0,0),(-1,-1), 0.8, colors.HexColor('#cccccc')),
                ('INNERGRID',      (0,1),(-1,-1), 0.3, colors.HexColor('#e0e0e0')),
            ]))
            return t

        gap = avail_w - 2 * bw
        if across and down:
            ac = box('Across \u2192', across, '#2980b9')
            dn = box('Down \u2193',   down,   '#27ae60')
            r  = Table([[ac, Spacer(gap, 1), dn]], colWidths=[bw, gap, bw])
            r.setStyle(TableStyle([
                ('VALIGN',(0,0),(-1,-1),'TOP'),
                ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0),
                ('TOPPADDING',(0,0),(-1,-1),0),  ('BOTTOMPADDING',(0,0),(-1,-1),0),
            ]))
            return r
        elif across:
            return box('Across \u2192', across, '#2980b9')
        elif down:
            return box('Down \u2193', down, '#27ae60')
        return None

    # ── 1) Cluelarni o'lchash ──
    clue_el = None
    clue_h  = 0
    best_fsz = 10
    if across or down:
        for fsz in (12, 11, 10, 9, 8, 7):
            clue_el = build_clue(fsz)
            if clue_el is None:
                break
            _, clue_h = clue_el.wrap(avail_w, usable_h)
            best_fsz = fsz
            if clue_h <= usable_h * 0.50:
                break

    # ── 2) Grid o'lchamlarini hisoblash ──
    grid_area_w = avail_w - 2 * gpad
    grid_area_h = usable_h - clue_h - spacer_h - 2 * gpad

    cell_w = grid_area_w / cols_n
    cell_h = grid_area_h / rows_n
    if cell_h >= cell_w:
        cell_h = cell_w              # kvadrat

    grid_w_pt = cell_w * cols_n
    grid_h_pt = cell_h * rows_n
    num_fs    = max(7, int(min(cell_w, cell_h) / mm * 0.85))

    # ── 3) Grid Table ──
    num_map = {(nc['x'], nc['y']): nc['number'] for nc in (numbered or [])}
    tdata = []
    for r in range(rows_n):
        row = []
        for c in range(cols_n):
            ch = grid[r][c]
            if ch == '#':
                row.append('')
            else:
                n = num_map.get((c, r))
                row.append(str(n) if n else '')
        tdata.append(row)

    gt = Table(tdata, colWidths=[cell_w]*cols_n, rowHeights=[cell_h]*rows_n)
    sc = [
        ('ALIGN',(0,0),(-1,-1),'LEFT'), ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('FONTNAME',(0,0),(-1,-1),'Helvetica-Bold'), ('FONTSIZE',(0,0),(-1,-1),num_fs),
        ('LEFTPADDING',(0,0),(-1,-1),2), ('RIGHTPADDING',(0,0),(-1,-1),1),
        ('TOPPADDING',(0,0),(-1,-1),1),  ('BOTTOMPADDING',(0,0),(-1,-1),1),
    ]
    for r in range(rows_n):
        for c in range(cols_n):
            if grid[r][c] == '#':
                sc.append(('BACKGROUND',(c,r),(c,r), colors.HexColor('#aaaaaa')))
                sc.append(('TEXTCOLOR', (c,r),(c,r), colors.HexColor('#aaaaaa')))
            else:
                sc.append(('BACKGROUND',(c,r),(c,r), colors.HexColor('#ffffaa')))
                sc.append(('BOX',       (c,r),(c,r), 1.2, colors.HexColor('#333333')))
                sc.append(('TEXTCOLOR', (c,r),(c,r), colors.HexColor('#222222')))
    gt.setStyle(TableStyle(sc))

    # ── 4) Yangi clue nusxasi (wrap qilinmagan) ──
    clue_final = build_clue(best_fsz) if (across or down) else None

    # ── 5) Bitta Flowable ──
    total_h = usable_h          # doim sahifani to'ldirish
    page_fl = _CrosswordPage(
        grid_table=gt, grid_w_pt=grid_w_pt, grid_h_pt=grid_h_pt,
        clue_table=clue_final, clue_w_pt=avail_w, clue_h_pt=clue_h,
        wrapper_pad=gpad, total_w=avail_w, total_h=total_h,
        spacer_h=spacer_h
    )
    elements.append(page_fl)
    return elements


def generate_find_pairings_pdf(exercise, content):
    """Find Pairings PDF — 4 ustunli 2 jadval, qaychi chiziqlari 2-jadval chiziq boshlarida"""
    elements = []

    pairs = content.get('pairs', [])
    if not pairs:
        return elements

    n_cols = 4
    n_rows = (len(pairs) + n_cols - 1) // n_cols

    avail_w = 190 * mm
    cell_w  = avail_w / n_cols
    cell_h  = 20 * mm
    font_sz = 14

    # --- ma'lumotlarni tayyorlash (ko'p so'zli katak alohida qatorlarda) ---
    def make_cell(text, text_color):
        text = _normalize_apostrophe(text)
        words = text.strip().split()
        if len(words) >= 2:
            lines = '<br/>'.join(words)
        else:
            lines = text
        style = ParagraphStyle('FPCell', fontName='Helvetica-Bold', fontSize=font_sz,
                               alignment=1, leading=font_sz + 4,
                               textColor=colors.HexColor(text_color))
        return Paragraph(lines, style)

    eng_data = []
    uzb_data = []
    for r in range(n_rows):
        eng_row = []
        uzb_row = []
        for c in range(n_cols):
            idx = r * n_cols + c
            if idx < len(pairs):
                eng_row.append(make_cell(pairs[idx].get('english', ''), '#0000cc'))
                uzb_row.append(make_cell(pairs[idx].get('uzbek', ''),   '#006622'))
            else:
                eng_row.append('')
                uzb_row.append('')
        eng_data.append(eng_row)
        uzb_data.append(uzb_row)

    # ---- 1-jadval: Inglizcha (sariq) ---- sahifaning yuqori qismida
    eng_table = Table(eng_data, colWidths=[cell_w]*n_cols, rowHeights=[cell_h]*n_rows)
    eng_table.setStyle(TableStyle([
        ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('BACKGROUND',    (0,0),(-1,-1), colors.HexColor('#ffffcc')),
        ('GRID',          (0,0),(-1,-1), 1.2, colors.HexColor('#0077aa')),
        ('TOPPADDING',    (0,0),(-1,-1), 4),
        ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ]))

    eng_wrapper = _ColoredBgWrapper(eng_table, bg_color='#ffffd6', border_color='#ccaa44',
                                    pad=6*mm, corner_r=4*mm)
    centered_eng = Table([[eng_wrapper]], colWidths=[avail_w + 14*mm])
    centered_eng.setStyle(TableStyle([
        ('ALIGN', (0,0),(0,0), 'CENTER'),
        ('LEFTPADDING',  (0,0),(0,0), 0),
        ('RIGHTPADDING', (0,0),(0,0), 0),
    ]))
    elements.append(centered_eng)

    # ---- Qaychi + chiziqlar ---
    # Qaychilar 2-jadval ustun va qator chiziqlarining boshlanish joyida
    # Gorizontal qaychi satri (ustunlar orasida)
    scissor_row_cells = []
    for c in range(n_cols + 1):
        scissor_row_cells.append('✂')
    sc_style = ParagraphStyle('ScRow', fontName='Helvetica', fontSize=11,
                              alignment=1, textColor=colors.HexColor('#cc4444'))
    # Ustun chegaralari uchun qaychi qatori
    sc_col_w = avail_w / (n_cols + 1)
    sc_data = [[Paragraph('✂', sc_style) for _ in range(n_cols + 1)]]
    sc_table = Table(sc_data, colWidths=[sc_col_w]*(n_cols + 1), rowHeights=[8*mm])
    sc_table.setStyle(TableStyle([
        ('ALIGN', (0,0),(-1,-1), 'CENTER'),
        ('VALIGN', (0,0),(-1,-1), 'MIDDLE'),
    ]))
    elements.append(Spacer(1, 3*mm))
    elements.append(sc_table)
    elements.append(Spacer(1, 3*mm))

    # ---- 2-jadval: O'zbekcha (yashil) ---- pastda, qaychi chizig'i bilan
    # Har bir qator oldida (chap tomonda) qaychi qo'yish — Drawing orqali
    uzb_table = Table(uzb_data, colWidths=[cell_w]*n_cols, rowHeights=[cell_h]*n_rows)
    uzb_table.setStyle(TableStyle([
        ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('BACKGROUND',    (0,0),(-1,-1), colors.HexColor('#ccffcc')),
        ('GRID',          (0,0),(-1,-1), 1.2, colors.HexColor('#009933')),
        ('TOPPADDING',    (0,0),(-1,-1), 4),
        ('BOTTOMPADDING', (0,0),(-1,-1), 4),
    ]))

    uzb_wrapper = _ColoredBgWrapper(uzb_table, bg_color='#d6ffd6', border_color='#44aa44',
                                    pad=6*mm, corner_r=4*mm)
    centered_uzb = Table([[uzb_wrapper]], colWidths=[avail_w + 14*mm])
    centered_uzb.setStyle(TableStyle([
        ('ALIGN', (0,0),(0,0), 'CENTER'),
        ('LEFTPADDING',  (0,0),(0,0), 0),
        ('RIGHTPADDING', (0,0),(0,0), 0),
    ]))
    elements.append(centered_uzb)

    return elements

@app.route('/api/check_answer', methods=['POST'])
def check_answer():
    """Javobni tekshirish"""
    data = request.json
    exercise = db.get_exercise(data['exercise_id'])
    
    if not exercise:
        return jsonify({'error': 'Mashq topilmadi'}), 404
    
    content = json.loads(exercise['content'])
    user_answers = data['answers']
    results = []
    
    if exercise['type'] == 'matching':
        correct_count = 0
        for item in content['items']:
            user_answer = user_answers.get(str(item['id']))
            is_correct = user_answer == item['match']
            results.append({
                'id': item['id'],
                'correct': is_correct,
                'correct_answer': item['match']
            })
            if is_correct:
                correct_count += 1
        score = (correct_count / len(content['items'])) * 100
        
    elif exercise['type'] == 'fill_gaps':
        correct_count = 0
        for word_item in content['words']:
            word_id = str(word_item['id'])
            user_answer = user_answers.get(word_id, '').strip().lower()
            # To'g'ri javobdan faqat tushirilgan harflarni olish
            correct_word = word_item['word']
            answer_word = word_item['answer'].strip().lower()
            
            # Tushirilgan harflarni hisoblash
            missing_chars = ''
            for i, char in enumerate(correct_word):
                if char == '_':
                    if i < len(answer_word):
                        missing_chars += answer_word[i]
            
            is_correct = user_answer == missing_chars
            results.append({
                'id': word_item['id'],
                'word': word_item['word'],
                'correct': is_correct,
                'correct_answer': missing_chars,
                'full_word': word_item['answer']
            })
            if is_correct:
                correct_count += 1
        score = (correct_count / len(content['words'])) * 100
        
    elif exercise['type'] == 'multiple_choice':
        correct_count = 0
        for i, question in enumerate(content['questions']):
            user_answer = user_answers.get(str(i))
            is_correct = user_answer == question['correct']
            results.append({
                'id': i,
                'correct': is_correct,
                'correct_answer': question['correct']
            })
            if is_correct:
                correct_count += 1
        score = (correct_count / len(content['questions'])) * 100
    
    elif exercise['type'] == 'word_search':
        # Word Search o'zi frontend tomonida tekshiriladi
        # Bu yerda faqat umumiy natija qaytariladi
        total_words = len(content.get('words', []))
        score = 100  # Frontend tomonida hisoblangan
        results = {'total_words': total_words}
    
    return jsonify({
        'score': round(score, 1),
        'results': results
    })

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Dars Mashqlari Server')
    parser.add_argument('--port', type=int, default=None, help='Server porti (default: 7000)')
    args = parser.parse_args()

    PORT = args.port or int(os.environ.get('PORT', 7000))
    DEBUG = os.environ.get('FLASK_ENV') != 'production'

    print("\n" + "="*50)
    print("WORKSHEET CREATOR")
    print("="*50)

    if DEBUG:
        ensure_port_free(PORT)

    print(f"\nServer ishga tushmoqda...")
    print(f"Brauzerda oching: http://127.0.0.1:{PORT}")
    print(f"Tarmoqdagi qurilmalar uchun: http://0.0.0.0:{PORT}")
    print("\nTo'xtatish uchun: Ctrl+C")
    print("="*50 + "\n")

    app.run(debug=DEBUG, host='0.0.0.0', port=PORT, use_reloader=False)
