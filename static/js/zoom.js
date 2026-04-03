/**
 * Zoom Control - Ekran o'lchamini boshqarish
 */

(function() {
    // Saqlangan zoom darajasini olish
    let currentZoom = localStorage.getItem('zoomLevel') || 100;
    currentZoom = parseInt(currentZoom);
    
    // Zoom chegaralari
    const MIN_ZOOM = 50;
    const MAX_ZOOM = 200;
    const ZOOM_STEP = 10;
    
    // Sahifa yuklanganda zoom ni qo'llash
    document.addEventListener('DOMContentLoaded', function() {
        applyZoom(currentZoom);
        createZoomControls();
    });
    
    // Zoom ni qo'llash
    function applyZoom(level) {
        document.body.style.zoom = level + '%';
        currentZoom = level;
        localStorage.setItem('zoomLevel', level);
        updateZoomDisplay();
    }
    
    // Zoom ko'rsatkichini yangilash
    function updateZoomDisplay() {
        const display = document.getElementById('zoom-level-display');
        if (display) {
            display.textContent = currentZoom + '%';
        }
    }
    
    // Zoom boshqaruv panelini yaratish
    function createZoomControls() {
        const controls = document.createElement('div');
        controls.id = 'zoom-controls';
        controls.innerHTML = `
            <button id="zoom-out" title="Kichiklashtirish (Ctrl+-)">➖</button>
            <span id="zoom-level-display">${currentZoom}%</span>
            <button id="zoom-in" title="Kattalashtirish (Ctrl++)">➕</button>
            <button id="zoom-reset" title="Asl holatga (Ctrl+0)">↺</button>
        `;
        document.body.appendChild(controls);
        
        // Event listeners
        document.getElementById('zoom-in').addEventListener('click', zoomIn);
        document.getElementById('zoom-out').addEventListener('click', zoomOut);
        document.getElementById('zoom-reset').addEventListener('click', zoomReset);
        
        // Klaviatura bilan boshqarish
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    zoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    zoomOut();
                } else if (e.key === '0') {
                    e.preventDefault();
                    zoomReset();
                }
            }
        });
        
        // Mouse wheel bilan zoom (Ctrl + scroll)
        document.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        }, { passive: false });
    }
    
    // Zoom funksiyalari
    function zoomIn() {
        if (currentZoom < MAX_ZOOM) {
            applyZoom(currentZoom + ZOOM_STEP);
        }
    }
    
    function zoomOut() {
        if (currentZoom > MIN_ZOOM) {
            applyZoom(currentZoom - ZOOM_STEP);
        }
    }
    
    function zoomReset() {
        applyZoom(100);
    }
    
    // Global funksiyalar
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.zoomReset = zoomReset;
})();
