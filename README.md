# Dars Mashqlari Web Loyihasi

Bu loyiha darslar uchun interaktiv mashqlar yaratish va ulardan foydalanish imkonini beradi.

## Mashq turlari:
- **Matching** - So'zlarni moslash mashqlari
- **Fill in Gaps** - Bo'sh joylarni to'ldirish mashqlari
- **Multiple Choice** - Test savollari

## O'rnatish va ishga tushirish:

### 1. Python paketlarini o'rnatish:
```bash
pip install -r requirements.txt
```

### 2. Dasturni ishga tushirish:
```bash
python app.py
```

### 3. Brauzerda ochish:
```
http://localhost:5000
```

## Foydalanish:

### Mashq yaratish:
1. Bosh sahifada mashq turini tanlang (Matching, Fill in Gaps yoki Multiple Choice)
2. Mashq nomini kiriting
3. So'zlar, matnlar yoki savollarni kiriting
4. "Saqlash" tugmasini bosing

### Mashqdan foydalanish:
1. "Barcha Mashqlar" sahifasiga o'ting
2. Kerakli mashqni tanlang
3. Mashqni bajaring
4. "Tekshirish" tugmasini bosib natijani ko'ring

## Fayl tuzilishi:
```
LessonQuizWeb/
├── app.py                 # Flask dasturi
├── db_manager.py          # Ma'lumotlar bazasi boshqaruvi
├── requirements.txt       # Python kutubxonalari
├── exercises.db          # SQLite ma'lumotlar bazasi (avtomatik yaratiladi)
├── templates/            # HTML shablonlar
│   ├── index.html        # Bosh sahifa
│   ├── admin.html        # Mashqlar ro'yxati
│   ├── create.html       # Mashq yaratish
│   └── exercise.html     # Mashqni bajarish
└── static/               # Static fayllar
    ├── css/
    │   └── style.css     # Stillar
    └── js/
        ├── admin.js      # Admin funksiyalari
        ├── create.js     # Yaratish funksiyalari
        └── exercise.js   # Mashq bajarish funksiyalari
```

## Xususiyatlar:
- ✅ 3 xil mashq turi
- ✅ Oson va tushunarli interfeys
- ✅ Avtomatik tekshirish va ball berish
- ✅ Mashqlarni saqlash va qayta ishlatish
- ✅ Responsiv dizayn (mobil qurilmalar uchun)

---
**Yaratilgan sana:** 2025
