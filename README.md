# TarotWall - Servidor de Mensajes con Frontend Cristal

Un servidor Node.js con frontend que permite enviar mensajes anónimos con sincronización en tiempo real y modo administrador.

## Características

- ✅ **Tarjeta flotante sticky** en la parte superior para enviar mensajes
- ✅ **Lista de mensajes** con diseño de tarjetas cristal
- ✅ **Modo administrador** activado con el mensaje "admintest123"
- ✅ **Base de datos SQLite** para persistencia de mensajes
- ✅ **Sincronización en tiempo real** con WebSockets
- ✅ **Carga paginada** de mensajes antiguos
- ✅ **Estilo cristal** tipo Windows 7 Aero con efectos de vidrio

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Instalar PM2 (recomendado para producción):**
   ```bash
   npm install -g pm2
   ```

3. **Ejecutar el servidor:**

   **Opción A - Con PM2 (recomendado):**
   ```bash
   ./manage.sh start
   ```
   
   **Opción B - Directo con Node:**
   ```bash
   npm start
   ```
   
   **Opción C - Desarrollo con auto-reload:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:3003
   ```

## Gestión con PM2

El proyecto incluye un script de gestión (`manage.sh`) para facilitar el manejo del servidor:

### Comandos disponibles:

```bash
# Iniciar la aplicación
./manage.sh start

# Detener la aplicación
./manage.sh stop

# Reiniciar la aplicación
./manage.sh restart

# Ver logs en tiempo real
./manage.sh logs

# Ver estado de la aplicación
./manage.sh status

# Eliminar la aplicación de PM2
./manage.sh delete

# Configurar auto-inicio al reiniciar el servidor
./manage.sh setup

# Instalar PM2 si no está instalado
./manage.sh install

# Mostrar ayuda
./manage.sh help
```

### Configuración de auto-inicio:

Para que el servidor se inicie automáticamente al reiniciar el sistema:

```bash
./manage.sh setup
```

Esto configurará PM2 para iniciarse automáticamente con el sistema operativo.

## Uso

### Enviar Mensajes
- Escribe tu mensaje en la tarjeta flotante superior
- Presiona Enter o haz clic en el botón de enviar
- Los mensajes aparecen inmediatamente para todos los usuarios conectados

### Modo Administrador
- Envía el mensaje: `admintest123`
- Se activará el modo admin (aparecerá un indicador dorado)
- Podrás eliminar mensajes haciendo clic en el icono de basura que aparece al pasar el mouse sobre cada mensaje

### Cargar Mensajes Antiguos
- Haz clic en "Cargar mensajes anteriores" en la parte inferior
- Se cargarán 20 mensajes más antiguos cada vez

## Tecnologías Utilizadas

- **Backend:** Node.js, Express, Socket.IO
- **Base de datos:** SQLite3
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Estilos:** Efectos cristal con backdrop-filter y gradientes
- **Iconos:** Font Awesome

## Estructura del Proyecto

```
TarotWall/
├── server.js          # Servidor principal
├── package.json       # Dependencias y scripts
├── messages.db        # Base de datos SQLite (se crea automáticamente)
└── public/
    ├── index.html     # Página principal
    ├── style.css      # Estilos cristal
    └── script.js      # Lógica del frontend
```

## API del Servidor

### WebSocket Events

**Cliente → Servidor:**
- `get_messages` - Obtener mensajes con paginación
- `new_message` - Enviar nuevo mensaje
- `delete_message` - Eliminar mensaje (solo admin)

**Servidor → Cliente:**
- `messages_response` - Respuesta con mensajes
- `message_added` - Nuevo mensaje agregado
- `message_deleted` - Mensaje eliminado
- `admin_mode` - Activación del modo admin
- `error` - Mensaje de error

## Base de Datos

La tabla `messages` tiene la siguiente estructura:
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT 0
);
```

## Personalización

### Cambiar el puerto
Modifica la variable `PORT` en `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Cambiar el comando de admin
Modifica la condición en `server.js`:
```javascript
if (message === 'tu_comando_admin') {
    // ...
}
```

### Modificar el estilo
Edita `public/style.css` para cambiar colores, efectos o diseño.

## Licencia

MIT License - Libre para uso personal y comercial.
