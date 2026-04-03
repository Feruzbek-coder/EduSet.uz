// Admin page - mashqlarni o'chirish

async function deleteExercise(exerciseId) {
    if (!confirm('Ushbu mashqni o\'chirmoqchimisiz?')) {
        return;
    }

    try {
        const response = await fetch(`/api/delete_exercise/${exerciseId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Mashq kartasini o'chirish
            const card = document.querySelector(`[data-id="${exerciseId}"]`);
            if (card) {
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    
                    // Agar mashqlar qolmasa, empty state ko'rsatish
                    const exercisesList = document.querySelector('.exercises-list');
                    if (exercisesList.children.length === 0) {
                        exercisesList.innerHTML = `
                            <div class="empty-state">
                                <p>❌ Hozircha mashqlar yo'q</p>
                                <a href="/" class="btn btn-primary">Mashq yaratish</a>
                            </div>
                        `;
                    }
                }, 300);
            }
        } else {
            alert('Xatolik yuz berdi!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Xatolik yuz berdi!');
    }
}
