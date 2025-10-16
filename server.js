const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  path: '/tarotwall/socket.io/'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/tarotwall', express.static('public'));

// Base de datos SQLite
const db = new sqlite3.Database('messages.db');

// Crear tabla de mensajes
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT 0
  )`);
});


// Función para obtener mensajes con paginación
function getMessages(offset = 0, limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Función para insertar mensaje
function insertMessage(message, isAdmin = false) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages (message, is_admin) VALUES (?, ?)`,
      [message, isAdmin],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// Función para eliminar mensaje
function deleteMessage(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM messages WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar mensajes iniciales al cliente
  socket.on('get_messages', async (data) => {
    try {
      const { offset = 0, limit = 20 } = data;
      const messages = await getMessages(offset, limit);
      socket.emit('messages_response', { messages, offset });
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      socket.emit('error', { message: 'Error obteniendo mensajes' });
    }
  });

  // Manejar nuevo mensaje
  socket.on('new_message', async (data) => {
    try {
      const { message } = data;
      
      // Insertar mensaje en la base de datos
      const messageId = await insertMessage(message);
      
      // Obtener el mensaje completo para enviarlo a todos
      const newMessage = {
        id: messageId,
        message: message,
        timestamp: new Date().toISOString(),
        is_admin: false
      };

      // Enviar a todos los clientes conectados
      io.emit('message_added', newMessage);
      
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      socket.emit('error', { message: 'Error procesando mensaje' });
    }
  });

  // Manejar eliminación de mensaje
  socket.on('delete_message', async (data) => {
    try {
      const { messageId } = data;
      const deleted = await deleteMessage(messageId);
      
      if (deleted > 0) {
        // Notificar a todos los clientes que el mensaje fue eliminado
        io.emit('message_deleted', { messageId });
      } else {
        socket.emit('error', { message: 'Mensaje no encontrado' });
      }
      
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      socket.emit('error', { message: 'Error eliminando mensaje' });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Ruta principal para la subruta
app.get('/tarotwall/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirigir sin barra final
app.get('/tarotwall', (req, res) => {
  res.redirect('/tarotwall/');
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en puerto ${PORT} en todas las interfaces`);
});
