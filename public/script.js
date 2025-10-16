// Configuración del socket
const socket = io({
  path: '/tarotwall/socket.io/'
});
let isAdminMode = false;
let currentOffset = 0;
const messagesPerPage = 20;
let isLoading = false;

// Elementos del DOM
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
loadMoreBtn.addEventListener('click', loadMoreMessages);

// Función para enviar mensaje
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        // Verificar si es comando de admin
        if (message === 'admintest123') {
            // Activar modo admin localmente sin enviar al servidor
            isAdminMode = true;
            document.body.classList.add('admin-mode');
            
            // Actualizar botones de eliminar en mensajes existentes
            updateDeleteButtons();
            
            alert('Modo administrador activado. Puedes eliminar mensajes haciendo clic en el icono de basura.');
            messageInput.value = '';
            return;
        }
        
        // Enviar mensaje normal al servidor
        socket.emit('new_message', { message });
        messageInput.value = '';
    }
}

// Función para cargar más mensajes
function loadMoreMessages() {
    if (isLoading) return;
    
    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    
    currentOffset += messagesPerPage;
    socket.emit('get_messages', { 
        offset: currentOffset, 
        limit: messagesPerPage 
    });
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Menos de 1 minuto
        return 'Ahora';
    } else if (diff < 3600000) { // Menos de 1 hora
        const minutes = Math.floor(diff / 60000);
        return `Hace ${minutes}m`;
    } else if (diff < 86400000) { // Menos de 1 día
        const hours = Math.floor(diff / 3600000);
        return `Hace ${hours}h`;
    } else {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Función para crear elemento de mensaje
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-card';
    messageDiv.dataset.messageId = message.id;
    
    // Solo mostrar botón de eliminar si este cliente tiene modo admin activo
    const deleteBtn = isAdminMode ? 
        `<button class="delete-btn" onclick="deleteMessage(${message.id})" title="Eliminar mensaje">
            <i class="fas fa-trash"></i>
        </button>` : '';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-author">Anónimo</span>
            <span class="message-date">${formatDate(message.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(message.message)}</div>
        ${deleteBtn}
    `;
    
    return messageDiv;
}

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para eliminar mensaje
function deleteMessage(messageId) {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
        socket.emit('delete_message', { messageId });
    }
}

// Función para mostrar mensajes
function displayMessages(messages, prepend = false) {
    if (prepend) {
        // Insertar al principio
        messages.forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
        });
    } else {
        // Reemplazar todos los mensajes
        messagesContainer.innerHTML = '';
        messages.forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
    }
    
    // Si el modo admin está activo, asegurar que todos los mensajes tengan botones de eliminar
    if (isAdminMode) {
        updateDeleteButtons();
    }
}

// Función para actualizar botones de eliminar en todos los mensajes
function updateDeleteButtons() {
    const messageCards = document.querySelectorAll('.message-card');
    messageCards.forEach(card => {
        const messageId = card.dataset.messageId;
        const existingBtn = card.querySelector('.delete-btn');
        
        if (!existingBtn) {
            // Crear botón de eliminar si no existe
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar mensaje';
            deleteBtn.onclick = () => deleteMessage(messageId);
            card.appendChild(deleteBtn);
        }
    });
}

// Event listeners del socket
socket.on('connect', () => {
    console.log('Conectado al servidor');
    // Cargar mensajes iniciales
    socket.emit('get_messages', { offset: 0, limit: messagesPerPage });
});

socket.on('messages_response', (data) => {
    const { messages, offset } = data;
    
    if (offset === 0) {
        // Primera carga
        displayMessages(messages);
        loadingIndicator.style.display = 'none';
    } else {
        // Carga adicional
        displayMessages(messages, true);
    }
    
    isLoading = false;
    loadMoreBtn.disabled = false;
    loadMoreBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Cargar mensajes anteriores';
    
    // Ocultar botón si no hay más mensajes
    if (messages.length < messagesPerPage) {
        loadMoreBtn.style.display = 'none';
    }
});

socket.on('message_added', (message) => {
    const messageElement = createMessageElement(message);
    messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
    
    // Scroll suave hacia arriba para mostrar el nuevo mensaje
    setTimeout(() => {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
});

socket.on('message_deleted', (data) => {
    const { messageId } = data;
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.classList.add('deleting');
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }
});


socket.on('error', (data) => {
    console.error('Error del servidor:', data.message);
    alert('Error: ' + data.message);
});

socket.on('disconnect', () => {
    console.log('Desconectado del servidor');
    loadingIndicator.style.display = 'flex';
    loadingIndicator.innerHTML = '<i class="fas fa-wifi"></i> Reconectando...';
});

// Auto-scroll al cargar mensajes antiguos
function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

// Detectar cuando el usuario llega al final de la página
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
        // Usuario cerca del final, no hacer nada especial
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    messageInput.focus();
});
