"""
Dars Mashqlari uchun ikonka yaratuvchi skript
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon():
    # Turli o'lchamlar uchun rasmlar
    sizes = [256, 128, 64, 48, 32, 16]
    images = []
    
    for size in sizes:
        # Yangi rasm yaratish (gradient fon)
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Yumaloq gradient fon
        center = size // 2
        for i in range(center, 0, -1):
            # Ko'k-binafsha gradient
            ratio = i / center
            r = int(41 + (99 - 41) * (1 - ratio))  # 41 -> 99
            g = int(128 + (102 - 128) * (1 - ratio))  # 128 -> 102
            b = int(185 + (241 - 185) * (1 - ratio))  # 185 -> 241
            
            # Doira chizish
            draw.ellipse([center - i, center - i, center + i, center + i], 
                        fill=(r, g, b, 255))
        
        # Markazda oq kitob emoji yoki harf
        # Font o'lchami
        font_size = int(size * 0.5)
        
        # Windows standart fontini ishlatamiz
        try:
            # Segoe UI Emoji - Windows 10/11 da mavjud
            font = ImageFont.truetype("seguiemj.ttf", font_size)
            text = "📚"
        except:
            try:
                # Oddiy font
                font = ImageFont.truetype("arial.ttf", font_size)
                text = "DM"
            except:
                font = ImageFont.load_default()
                text = "DM"
        
        # Matn joylashuvi
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - bbox[1]
        
        # Oq rang bilan yozish
        draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
        
        images.append(img)
    
    # ICO faylga saqlash
    output_path = os.path.join('static', 'favicon.ico')
    images[0].save(output_path, format='ICO', sizes=[(s, s) for s in sizes], 
                   append_images=images[1:])
    print(f"✅ Ikonka yaratildi: {output_path}")
    
    # PNG versiyasini ham saqlash
    png_path = os.path.join('static', 'logo.png')
    images[0].save(png_path, format='PNG')
    print(f"✅ Logo yaratildi: {png_path}")

def create_simple_icon():
    """Oddiy geometrik ikonka yaratish"""
    sizes = [256, 128, 64, 48, 32, 16]
    images = []
    
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Yumaloq fon - gradient ko'k
        center = size // 2
        radius = center - 2
        
        # Asosiy doira - gradient
        for i in range(radius, 0, -1):
            ratio = i / radius
            # Ko'k-binafsha gradient (yuqoridan pastga)
            r = int(59 * ratio + 147 * (1 - ratio))
            g = int(130 * ratio + 112 * (1 - ratio))
            b = int(246 * ratio + 219 * (1 - ratio))
            draw.ellipse([center - i, center - i, center + i, center + i], 
                        fill=(r, g, b, 255))
        
        # Oq kitob shakli
        book_margin = size * 0.25
        book_left = book_margin
        book_right = size - book_margin
        book_top = size * 0.3
        book_bottom = size * 0.75
        book_center = size // 2
        
        # Kitob sahifalari (oq to'rtburchaklar)
        draw.rectangle([book_left, book_top, book_center - 2, book_bottom], 
                      fill=(255, 255, 255, 255))
        draw.rectangle([book_center + 2, book_top, book_right, book_bottom], 
                      fill=(255, 255, 255, 255))
        
        # Kitob orqa qismi (markaziy chiziq)
        draw.rectangle([book_center - 2, book_top - 3, book_center + 2, book_bottom + 3], 
                      fill=(255, 255, 255, 255))
        
        # Ustida qalam yoki yulduz
        star_y = size * 0.18
        star_size = size * 0.08
        # Kichik yulduz
        draw.polygon([
            (center, star_y - star_size),
            (center + star_size * 0.3, star_y - star_size * 0.3),
            (center + star_size, star_y),
            (center + star_size * 0.3, star_y + star_size * 0.3),
            (center, star_y + star_size),
            (center - star_size * 0.3, star_y + star_size * 0.3),
            (center - star_size, star_y),
            (center - star_size * 0.3, star_y - star_size * 0.3),
        ], fill=(255, 215, 0, 255))  # Oltin rang
        
        images.append(img)
    
    # Saqlash
    output_path = os.path.join('static', 'favicon.ico')
    images[0].save(output_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f"✅ Ikonka yaratildi: {output_path}")
    
    png_path = os.path.join('static', 'logo.png')
    images[0].save(png_path, format='PNG')
    print(f"✅ Logo yaratildi: {png_path}")

if __name__ == '__main__':
    print("🎨 Dars Mashqlari ikonkasi yaratilmoqda...")
    create_simple_icon()
    print("✅ Tayyor!")
