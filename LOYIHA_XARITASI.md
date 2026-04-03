# 🗺️ Loyiha Xaritasi: Dars Mashqlari Web

## 📋 Loyiha Haqida

**Loyiha nomi:** DarsMashqlari (Dars Mashqlari Web)  
**Turi:** Interaktiv ta'lim platformasi  
**Texnologiya:** Flask (Python), SQLite, HTML/CSS/JavaScript  
**Versiyalar:** Web dastur va Desktop dastur  

Bu loyiha o'qituvchilar va o'quvchilar uchun turli xil mashqlar yaratish va bajarish imkonini beruvchi ta'lim platformasidir.

---

## 🎯 Asosiy Xususiyatlar

### 1. **Mashq Turlari**
- 🔄 **Matching (Moslash)** - So'zlarni moslash mashqlari
- ✍️ **Fill in Gaps (Bo'sh joylarni to'ldirish)** - Matnda bo'sh joylarni to'ldirish
- ✅ **Multiple Choice (Ko'p tanlovli)** - Test savollari

### 2. **Qo'shimcha Modullar**
- 📚 **Vocabulary (Lug'at)** - So'zlar bazasi boshqaruvi
- 🐾 **Animals (Hayvonlar)** - Hayvonlar bilan bog'liq mashqlar
- 📊 **Categories (Kategoriyalar)** - Mashqlarni kategoriyalash
- 👨‍🏫 **Lesson Assistant** - Darslar uchun yordamchi vosita

### 3. **PDF Generatsiya**
- Mashqlarni PDF formatda export qilish imkoniyati

---

## 📂 Loyiha Tuzilishi

```
LessonQuizWeb/
│
├── 🐍 ASOSIY PYTHON FAYLLAR
│   ├── app.py                      # Flask web dasturi (asosiy backend)
│   ├── desktop_app.py              # PyWebView bilan desktop versiya
│   ├── db_manager.py               # SQLite baza boshqaruvi
│   ├── run.py                      # Dasturni ishga tushirish skripti
│   └── codes.py                    # Qo'shimcha kod funksiyalari
│
├── 📄 WEB SAHIFALAR (templates/)
│   ├── index.html                  # Bosh sahifa
│   ├── admin.html                  # Mashqlar boshqaruvi
│   ├── create.html                 # Mashq yaratish sahifasi
│   ├── exercise.html               # Mashqni bajarish sahifasi
│   ├── exercise_selector.html      # Mashq tanlash
│   ├── exercises_by_type.html      # Tur bo'yicha mashqlar ro'yxati
│   ├── vocabulary.html             # Lug'at boshqaruvi
│   ├── animals.html                # Hayvonlar mashqlari
│   ├── animals_new.html            # Yangi hayvonlar mashqi
│   ├── categories.html             # Kategoriyalar sahifasi
│   └── lesson_assistant.html       # Dars yordamchisi
│
├── 🎨 FRONTEND FAYLLAR (static/)
│   ├── css/
│   │   └── style.css               # Asosiy CSS stillari
│   ├── js/
│   │   ├── admin.js                # Admin panel logikasi
│   │   ├── create.js               # Mashq yaratish logikasi
│   │   ├── exercise.js             # Mashq bajarish logikasi
│   │   └── zoom.js                 # Rasm kattalashtirish funksiyasi
│   └── images/
│       └── animals/                # Hayvonlar rasmlari
│
├── 🔧 YORDAMCHI VOSITALAR (tools/)
│   ├── generate_cartoon_animals_png.py  # Hayvon rasmlarini generatsiya
│   ├── generate_pdf_direct.py           # PDF yaratish
│   └── generate_test_pdf.py             # Test PDF yaratish
│
├── 📦 BUILD VA DISTRIBUSIYA
│   ├── build/                      # PyInstaller build fayllari
│   ├── installer/
│   │   └── DarsMashqlari_Setup.iss # Inno Setup installer skripti
│   ├── DarsMashqlari.spec          # PyInstaller spec (web)
│   └── DarsMashqlari_Desktop.spec  # PyInstaller spec (desktop)
│
├── 📋 KONFIGURATSIYA FAYLLAR
│   ├── requirements.txt            # Python dependencies
│   ├── README.md                   # Loyiha hujjatlari
│   └── funksiyalar.txt             # Funksiyalar ro'yxati
│
└── 💾 MA'LUMOTLAR BAZASI
    └── exercises.db                # SQLite baza (runtime yaratiladi)
```

---

## 🔄 Ma'lumotlar Bazasi Strukturasi

### **exercises** jadvali
```sql
- id (INTEGER PRIMARY KEY)
- title (TEXT) - Mashq nomi
- type (TEXT) - Mashq turi (matching, fill_gaps, multiple_choice)
- content (TEXT/JSON) - Mashq ma'lumotlari
- created_at (TIMESTAMP) - Yaratilgan vaqt
```

### **vocabularies** jadvali
```sql
- id (INTEGER PRIMARY KEY)
- title (TEXT) - Lug'at nomi
- words (TEXT/JSON) - So'zlar ro'yxati
- created_at (TIMESTAMP) - Yaratilgan vaqt
```

---

## 🛣️ Web Route'lar (Flask Endpoints)

### **Asosiy Sahifalar**
- `GET /` - Bosh sahifa
- `GET /admin` - Mashqlar boshqaruvi
- `GET /create` - Mashq yaratish sahifasi
- `GET /exercise/<id>` - Mashqni bajarish
- `GET /exercise_selector` - Mashq tanlash
- `GET /exercises_by_type/<type>` - Tur bo'yicha mashqlar

### **API Endpoints**
- `POST /api/save_exercise` - Mashqni saqlash
- `GET /api/get_exercise/<id>` - Mashqni olish
- `GET /api/get_all_exercises` - Barcha mashqlarni olish
- `DELETE /api/delete_exercise/<id>` - Mashqni o'chirish
- `PUT /api/update_exercise/<id>` - Mashqni yangilash

### **Lug'at API**
- `POST /api/save_vocabulary` - Lug'atni saqlash
- `GET /api/get_vocabularies` - Barcha lug'atlarni olish
- `GET /api/get_vocabulary/<id>` - Bitta lug'atni olish

### **PDF Export**
- `POST /api/generate_pdf` - PDF yaratish

### **Hayvonlar Moduli**
- `GET /animals` - Hayvonlar mashqlari ro'yxati
- `GET /animals_new` - Yangi hayvonlar mashqi

---

## 🔐 Asosiy Klaslar va Funksiyalar

### **DatabaseManager** (db_manager.py)
```python
- __init__(db_name) - Baza initsializatsiyasi
- init_db() - Jadvallarni yaratish
- save_exercise(title, type, content) - Mashqni saqlash
- get_exercise(id) - Mashqni olish
- get_all_exercises() - Barcha mashqlarni olish
- update_exercise(id, ...) - Mashqni yangilash
- delete_exercise(id) - Mashqni o'chirish
- save_vocabulary(title, words) - Lug'atni saqlash
- get_vocabularies() - Lug'atlarni olish
```

### **Flask App** (app.py)
```python
- check_port_available(port) - Port tekshirish
- kill_old_processes() - Eski jarayonlarni to'xtatish
- ensure_port_free(port) - Port bo'shatish
- generate_access_code() - Ruxsat kodi generatsiya
- register_routes() - Route'larni ro'yxatdan o'tkazish
```

---

## 🚀 Ishga Tushirish

### **1. Web Versiya**
```bash
# Virtual environment yaratish (ixtiyoriy)
python -m venv .venv
.venv\Scripts\activate

# Dependencies o'rnatish
pip install -r requirements.txt

# Dasturni ishga tushirish
python app.py

# Brauzerda ochish
http://localhost:5000
```

### **2. Desktop Versiya**
```bash
# PyWebView bilan
python desktop_app.py
```

### **3. EXE Build Qilish**
```bash
# Web versiya uchun
pyinstaller DarsMashqlari.spec

# Desktop versiya uchun
pyinstaller DarsMashqlari_Desktop.spec
```

### **4. Installer Yaratish**
```bash
# Inno Setup bilan
# installer/DarsMashqlari_Setup.iss faylini kompilyatsiya qilish
```

---

## 🔧 Dependencies (requirements.txt)

```
Flask==3.0.0           # Web framework
Pillow==10.4.0         # Rasm bilan ishlash
reportlab              # PDF generatsiya qilish uchun
pywebview              # Desktop versiya uchun (spec faylda)
```

---

## 📱 Frontend Texnologiyalar

- **HTML5** - Sahifa tuzilishi
- **CSS3** - Stillar va dizayn
- **JavaScript (Vanilla)** - Interaktiv funksiyalar
- **Bootstrap** yoki o'xshash framework (style.css ichida)

### **JavaScript Modullari**
1. **admin.js** - Mashqlarni boshqarish (CRUD)
2. **create.js** - Mashq yaratish formasi
3. **exercise.js** - Mashq bajarish logikasi, javoblarni tekshirish
4. **zoom.js** - Rasmlarni kattalashtirish

---

## 🎯 Foydalanuvchi Flow

```
[Bosh Sahifa] 
    ↓
[Mashq Turini Tanlash]
    ↓
[Mashq Yaratish] → [Saqlash] → [Ma'lumotlar Bazasi]
    ↓
[Mashqlar Ro'yxati]
    ↓
[Mashqni Bajarish]
    ↓
[Javoblarni Tekshirish] → [Natija ko'rsatish]
```

---

## 🔒 Xavfsizlik Xususiyatlari

- Access code sistemasi (kodli kirish)
- Local host ga cheklangan (127.0.0.1)
- SQLite injection himoyasi (parametrized queries)
- Port band bo'lsa, avtomatik boshqa portga o'tish

---

## 📊 Mashq Kontenti Formati (JSON)

### **Matching Exercise**
```json
{
  "pairs": [
    {"left": "apple", "right": "olma"},
    {"left": "book", "right": "kitob"}
  ]
}
```

### **Fill in Gaps**
```json
{
  "text": "Bu ____ kitob",
  "answers": ["yaxshi"]
}
```

### **Multiple Choice**
```json
{
  "questions": [
    {
      "question": "2+2=?",
      "options": ["3", "4", "5"],
      "correct": 1
    }
  ]
}
```

---

## 🛠️ Kelajakda Qo'shilishi Mumkin

- [ ] Foydalanuvchi autentifikatsiyasi
- [ ] Natijalar tarixini saqlash
- [ ] Mashqlar statistikasi
- [ ] Multimedia qo'llab-quvvatlash (audio, video)
- [ ] Online multi-user rejimi
- [ ] Import/Export funksiyalari
- [ ] Mashq shablonlari
- [ ] AI yordami bilan mashq yaratish

---

## 🐛 Debug va Logging

**Log joylari:**
- Console output (terminal)
- Port band bo'lsa ogohlantirish
- Ma'lumotlar bazasi xatolari

**Keng uchraydigan muammolar:**
- Port band (5000) → Avtomatik boshqa portga o'tadi
- Ma'lumotlar bazasi topilmadi → Avtomatik yaratiladi
- Static fayllar yuklanmadi → Path muammosi (EXE da)

---

## 📞 Texnik Ma'lumotlar

**Python versiyasi:** 3.8+  
**Ma'lumotlar bazasi:** SQLite3  
**Web framework:** Flask 3.0.0  
**Frontend:** Vanilla JavaScript, CSS  
**Build tool:** PyInstaller  
**Installer:** Inno Setup  
**Desktop wrapper:** PyWebView  

---

## 📝 Muhim Fayllar Tavsifi

| Fayl | Maqsad | Muhimligi |
|------|--------|-----------|
| app.py | Asosiy Flask dasturi | ⭐⭐⭐⭐⭐ |
| db_manager.py | Ma'lumotlar bazasi logikasi | ⭐⭐⭐⭐⭐ |
| exercise.js | Frontend mashq logikasi | ⭐⭐⭐⭐ |
| desktop_app.py | Desktop versiya | ⭐⭐⭐ |
| requirements.txt | Dependencies | ⭐⭐⭐⭐⭐ |
| .spec fayllar | Build konfiguratsiyasi | ⭐⭐⭐ |

---

## 🎓 O'rganish Uchun Resurslar

- **Flask:** https://flask.palletsprojects.com/
- **SQLite:** https://www.sqlite.org/docs.html
- **ReportLab (PDF):** https://www.reportlab.com/docs/reportlab-userguide.pdf
- **PyInstaller:** https://pyinstaller.org/en/stable/

---

**Loyiha holati:** ✅ Ishlab chiqish bosqichida  
**So'nggi yangilanish:** 2026-03-08  
**Yaratuvchi:** -  
**Litsenziya:** -

---

### 💡 Eslatma
Bu loyiha O'zbekiston ta'lim tizimi uchun maxsus ishlab chiqilgan va o'zbek tilida mashqlar yaratish uchun optimallashtirilgan.
