"""
Dars Mashqlari - Windows Desktop Dasturi
PyWebView orqali alohida oynada ishlaydi
"""
import webview
import threading
import sys
import os
import socket

# Flask app ni import qilish
from app import app

def get_base_path():
    """EXE yoki script uchun to'g'ri base path olish"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

def find_free_port(start_port=5000):
    """Bo'sh port topish"""
    for port in range(start_port, start_port + 100):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        if result != 0:  # Port bo'sh
            return port
    return start_port

def start_flask_server(port):
    """Flask serverni ishga tushirish"""
    app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False, threaded=True)

if __name__ == '__main__':
    # Bo'sh port topish
    PORT = find_free_port(5000)
    
    # Flask serverni alohida threadda ishga tushirish
    server_thread = threading.Thread(target=start_flask_server, args=(PORT,), daemon=True)
    server_thread.start()
    
    # Biroz kutish - server ishga tushishi uchun
    import time
    time.sleep(1)
    
    # PyWebView oynasini yaratish
    window = webview.create_window(
        title='📋 Worksheet Creator',
        url=f'http://127.0.0.1:{PORT}',
        width=1200,
        height=800,
        resizable=True,
        min_size=(800, 600),
        text_select=True
    )
    
    # Oynani ishga tushirish
    webview.start()
