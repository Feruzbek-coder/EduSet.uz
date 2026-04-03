import webbrowser
import time
import threading
import sys
import os
import socket
import subprocess

def check_port_available(port):
    """Port band yoki yo'qligini tekshirish"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result != 0  # True = port bo'sh

def find_free_port(start_port=5000):
    """Bo'sh port topish"""
    for port in range(start_port, start_port + 100):
        if check_port_available(port):
            return port
    return start_port

def kill_processes_on_port(port):
    """Portni band qilgan jarayonni to'xtatish"""
    if sys.platform == 'win32':
        try:
            # netstat orqali PID ni topish
            result = subprocess.run(
                f'netstat -ano | findstr ":{port}"',
                shell=True, capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.strip().split('\n'):
                if 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True, timeout=5)
                        time.sleep(1)
                        return True
        except:
            pass
    return False

# app.py dan Flask app ni import qilish
from app import app

PORT = 7000

def open_browser(port):
    """Brauzerni avtomatik ochish"""
    time.sleep(2)
    webbrowser.open(f'http://127.0.0.1:{port}')

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎓 DARS MASHQLARI TIZIMI")
    print("="*50)
    
    # Portni tekshirish
    if not check_port_available(PORT):
        print(f"\n⚠️  Port {PORT} band.")
        print("🔍 Eski jarayonni to'xtatish urinilmoqda...")
        
        if kill_processes_on_port(PORT):
            print("✅ Eski jarayon to'xtatildi.")
            time.sleep(1)
        
        # Qayta tekshirish
        if not check_port_available(PORT):
            # Bo'sh port topish
            PORT = find_free_port(5001)
            print(f"📌 Boshqa portda ishga tushirilmoqda: {PORT}")
    
    # Brauzerni alohida threadda ochish
    threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()
    
    print(f"\n✅ Server ishga tushmoqda...")
    print(f"🌐 Brauzer avtomatik ochiladi: http://127.0.0.1:{PORT}")
    print("\n💡 Dasturni to'xtatish uchun: Ctrl+C yoki oynani yoping")
    print("="*50 + "\n")
    
    try:
        app.run(debug=False, host='127.0.0.1', port=PORT, use_reloader=False)
    except Exception as e:
        print(f"\n❌ Xatolik: {e}")
        input("\nDavom etish uchun Enter bosing...")
