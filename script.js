document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const calorieForm = document.getElementById('calorieForm');
    const cardsList = document.getElementById('cardsList');
    const modal = document.getElementById('cardDetailModal');
    const closeBtn = document.querySelector('.close');
    const saveBtn = document.getElementById('saveBtn');
    const subtractBtn = document.getElementById('subtractBtn');
    const remainingCaloriesSpan = document.getElementById('remainingCalories');
    const calorieProgress = document.getElementById('calorieProgress');
    const subtractAmountInput = document.getElementById('subtractAmount');
    
    let cards = JSON.parse(localStorage.getItem('calorieCards')) || [];
    let currentCardId = null;
    
    // Función para generar colores aleatorios (versión colores pastel)
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 80%, 80%)`;
    }
    
    // Función para guardar fichas en localStorage
    function saveCards() {
        try {
            localStorage.setItem('calorieCards', JSON.stringify(cards));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                showNotification('¡Atención! El almacenamiento está lleno. Elimina algunas fichas.', 'error');
            }
        }
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    // Función para renderizar las fichas
    function renderCards() {
        cardsList.innerHTML = '';
        
        if (cards.length === 0) {
            cardsList.innerHTML = '<p class="no-cards-message">No hay fichas creadas. Crea una nueva ficha para comenzar.</p>';
            return;
        }
        
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundColor = card.color;
            cardElement.innerHTML = `
                <h3>${card.nombre} ${card.apellidos}</h3>
                <p>Fecha: ${card.fechaCreacion}</p>
                <p class="calories-remaining">${card.caloriasRestantes} / ${card.caloriasIniciales} kcal</p>
                <button class="delete-btn" data-id="${card.id}">Eliminar</button>
            `;
            
            cardElement.addEventListener('click', (e) => {
                // Solo abre el detalle si no se hizo clic en el botón de eliminar
                if (!e.target.classList.contains('delete-btn')) {
                    openCardDetail(card.id);
                }
            });
            
            cardsList.appendChild(cardElement);
        });
        
        // Añadir event listeners a los botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Evita que se active el click de la tarjeta
                const cardId = parseInt(this.getAttribute('data-id'));
                deleteCard(cardId);
            });
        });
    }
    
    // Función para eliminar una ficha
    function deleteCard(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta ficha? Esta acción no se puede deshacer.')) {
            cards = cards.filter(card => card.id !== id);
            saveCards();
            renderCards();
            showNotification('Ficha eliminada correctamente', 'success');
            
            // Cierra el modal si estaba abierto
            if (currentCardId === id) {
                modal.style.display = 'none';
            }
        }
    }
    
    // Abrir detalle de ficha
    function openCardDetail(id) {
        const card = cards.find(c => c.id === id);
        if (!card) return;
        
        currentCardId = id;
        document.getElementById('modalTitle').textContent = `${card.nombre} ${card.apellidos}`;
        remainingCaloriesSpan.textContent = card.caloriasRestantes;
        subtractAmountInput.value = '';
        
        // Calcular porcentaje de progreso
        const progressPercentage = (card.caloriasRestantes / card.caloriasIniciales) * 100;
        calorieProgress.style.width = `${progressPercentage}%`;
        
        // Cambiar color de la barra según el porcentaje
        if (progressPercentage < 20) {
            calorieProgress.style.backgroundColor = 'var(--danger-color)';
        } else if (progressPercentage < 50) {
            calorieProgress.style.backgroundColor = 'var(--secondary-color)';
        } else {
            calorieProgress.style.backgroundColor = 'var(--primary-color)';
        }
        
        modal.style.display = 'block';
    }
    
    // Evento para el formulario
    calorieForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const edad = document.getElementById('edad').value;
        const genero = document.getElementById('genero').value;
        const caloriasInput = document.getElementById('calorias');
        const calorias = parseInt(caloriasInput.value);
        
        // Validar campos vacíos
        if (!nombre || !apellidos || !edad || !genero || !caloriasInput.value) {
            showNotification('Por favor complete todos los campos', 'error');
            return;
        }
        
        // Validar calorías con mensajes más específicos
        if (calorias < 1500) {
            showNotification('ADVERTENCIA: Mínimo 1500 calorías diarias recomendadas', 'error');
            caloriasInput.focus();
            return;
        }
        
        if (calorias > 3500) {
            showNotification('ADVERTENCIA: Máximo 3500 calorías diarias recomendadas', 'error');
            caloriasInput.focus();
            return;
        }
        
        // Crear nueva ficha
        const newCard = {
            id: Date.now(),
            nombre,
            apellidos,
            edad,
            genero,
            caloriasIniciales: calorias,
            caloriasRestantes: calorias,
            fechaCreacion: new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            color: getRandomColor()
        };
        
        cards.push(newCard);
        saveCards();
        renderCards();
        
        // Resetear formulario y mostrar mensaje de éxito
        calorieForm.reset();
        showNotification('¡Ficha creada exitosamente!', 'success');
    });
    
    // Restar calorías
    subtractBtn.addEventListener('click', function() {
        const subtractAmount = parseInt(subtractAmountInput.value);
        
        if (!subtractAmount || subtractAmount <= 0) {
            showNotification('Ingrese una cantidad válida', 'error');
            return;
        }
        
        const cardIndex = cards.findIndex(c => c.id === currentCardId);
        if (cardIndex === -1) return;
        
        if (subtractAmount > cards[cardIndex].caloriasRestantes) {
            showNotification('No puedes restar más calorías de las disponibles', 'error');
            return;
        }
        
        cards[cardIndex].caloriasRestantes -= subtractAmount;
        remainingCaloriesSpan.textContent = cards[cardIndex].caloriasRestantes;
        
        // Actualizar barra de progreso
        const progressPercentage = (cards[cardIndex].caloriasRestantes / cards[cardIndex].caloriasIniciales) * 100;
        calorieProgress.style.width = `${progressPercentage}%`;
        
        // Cambiar color si es necesario
        if (progressPercentage < 20) {
            calorieProgress.style.backgroundColor = 'var(--danger-color)';
        } else if (progressPercentage < 50) {
            calorieProgress.style.backgroundColor = 'var(--secondary-color)';
        }
        
        subtractAmountInput.value = '';
        showNotification(`${subtractAmount} calorías restadas`, 'success');
    });
    
    // Guardar cambios
    saveBtn.addEventListener('click', function() {
        saveCards();
        renderCards();
        modal.style.display = 'none';
        showNotification('Cambios guardados correctamente', 'success');
    });
    
    // Cerrar modal
    closeBtn.addEventListener('click', function() {
        // Recargar datos originales si no se guardaron
        const originalCards = JSON.parse(localStorage.getItem('calorieCards')) || [];
        const originalCard = originalCards.find(c => c.id === currentCardId);
        
        if (originalCard) {
            const cardIndex = cards.findIndex(c => c.id === currentCardId);
            if (cardIndex !== -1) {
                cards[cardIndex] = {...originalCard};
            }
        }
        
        modal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            // Recargar datos originales si no se guardaron
            const originalCards = JSON.parse(localStorage.getItem('calorieCards')) || [];
            const originalCard = originalCards.find(c => c.id === currentCardId);
            
            if (originalCard) {
                const cardIndex = cards.findIndex(c => c.id === currentCardId);
                if (cardIndex !== -1) {
                    cards[cardIndex] = {...originalCard};
                }
            }
            
            modal.style.display = 'none';
        }
    });
    
    // Cargar las fichas al iniciar
    renderCards();
});