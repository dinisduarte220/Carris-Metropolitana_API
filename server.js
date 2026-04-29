require('dns').setDefaultResultOrder('ipv4first')
require('dotenv').config()

const express = require('express');

const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000

// Session and OAuth
const session = require('express-session')
const authRoutes = require('./routes/auth')
const { google } = require('googleapis')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

app.use(bodyParser.json());

// Logging System
const logFilePath = 'server.log'

// Clear log file on startup
fs.writeFileSync(logFilePath, '');

function logMessage(message) {const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const timestamp = `${day}-${month}-${year} - ${hours}:${minutes}`;
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logEntry);
}

logMessage("SERVER STARTED")

// POST endpoint to log messages
app.post('/log', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Log the message to the server log
  logMessage(message);

  // Respond to the client
  res.status(200).json({ success: true, message: 'Log entry added' });
});

// Define Storage and Settings files locations
const storageFilePath = path.join(__dirname, 'JSON', 'storage.json');
const settingsFilePath = path.join(__dirname, 'JSON', 'settings.json');

// Lines Endpoint
app.use('/lines', express.static(path.join(__dirname, 'public', 'endpoints', 'lines')))
// Stops Endpoint
app.use('/stops', express.static(path.join(__dirname, 'public', 'endpoints', 'stops')))
// Settings Endpoint
app.use('/settings', express.static(path.join(__dirname, 'public', 'endpoints', 'settings')))

// Lines Endpoint - Details for a specific Line
app.use('/lines/:line_id', express.static(path.join(__dirname, 'public', 'endpoints', 'lines', 'line_id')))
// Stops Endpoint - Details for a specific Stop
app.use('/stops/:stop_id', express.static(path.join(__dirname, 'public', 'endpoints', 'stops', 'stop_id')))

// Settings Endpoints - Get & Update
app.get('/settings', (req, res) => {
  try {
      const data = fs.readFileSync(settingsFilePath, 'utf8')
      const settings = JSON.parse(data)
      res.json(settings)
  } catch (error) {
      console.error(error)
      res.status(500).json({
          icon: "fa-solid fa-triangle-exclamation",
          message: "[ERRO] Ocorreu um erro ao carregar as configurações!"
      })
  }
})
app.post('/settings', (req, res) => {
  try {
      const data = fs.readFileSync(settingsFilePath, 'utf8')
      let settings = JSON.parse(data)
      const updates = req.body

      // Validar se existem updates
      if (!updates || typeof updates !== 'object') {
          return res.status(400).json({
              error: '[ERROR] Invalid or missing settings update data'
          })
      }

      // Atualizar configurações
      settings = { ...settings, ...updates }

      try {
          fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2))
          res.json({
              message: '[SUCCESS] Configurações atualizadas com sucesso!',
              settings
          })
          logMessage("Settings updated")
      } catch (writeError) {
          console.error(writeError)
          res.status(500).json({
              icon: 'fa-solid fa-triangle-exclamation',
              message: '[ERRO] Ocorreu um erro ao guardar as configurações!'
          })
      }
  } catch (readError) {
      console.error(readError)
      res.status(500).json({
          icon: 'fa-solid fa-triangle-exclamation',
          message: '[ERRO] Ocorreu um erro ao processar as configurações!'
      })
  }
})

app.get('/api/metro/*', async (req, res) => {
  const endpoint = req.params[0]

  const url = `https://api.metrolisboa.pt:8243/estadoServicoML/1.0.1/${endpoint}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.METRO_BEARER}`,
      Accept: 'application/json'
    }
  })

  const text = await response.text()

  try {
    res.json(JSON.parse(text))
  } catch {
    res.status(response.status).send(text)
  }
})

// DataBase endpoints
const pool = require("./db")

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// User session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}))
app.use(authRoutes)

app.get('/me' , (req , res)=>{
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false })
  }

  res.json({
    loggedIn: true,
    user: req.session.user
  })
})

// Login
app.get('/login' , async (req , res)=>{
  if (!req.session.user) {
    res.redirect('auth/google')
  }
})

// Store a new favorite
app.post('/storage', async (req, res) => {
  try {
    const { newFavorite } = req.body
    
    if (!newFavorite) {
      return res.status(400).json({
        error: '[ERROR] Missing required field: value'
      })
    }

    // Check if there is a previous favorite for that user
    const isFavorite = await pool.query(`SELECT * FROM favorites WHERE user_id = $1 AND favorite_id = $2`, [req.session.user.id, newFavorite.id])
    if (isFavorite.rows.length > 0) {
      return res.status(409).json({ message: '[INFO] That user already has that line/stop favorited', id: newFavorite.id })
    }
    
    const lastPosition = await pool.query(
      `
      SELECT COALESCE(MAX(position), 0) as max
      FROM favorites
      WHERE user_id = $1
      `,
      [req.session.user.id]
    )

    const nextPosition = Number(lastPosition.rows[0].max) + 1

    await pool.query(
      `
      INSERT INTO favorites (user_id, type, favorite_id, position)
      VALUES ($1, $2, $3, $4)
      `,
      [
        req.session.user.id,
        newFavorite.type,
        newFavorite.id,
        nextPosition
      ]
    )

    res.status(200).json({ message: 'New favorite stored' })
  } catch (error) {
    console.error(error.stack)
    res.status(500).json({ message: '[SERVER] An error occured when storing the favorite' })
  }
})

// Storage Endpoints - Get & Store
app.get('/storage', async (req, res) => {
  try {
    const userFavorites = await pool.query('SELECT * FROM favorites WHERE user_id = $1 ORDER BY position ASC', [req.session.user.id])
    const data = userFavorites.rows

    // No ID: return all stored items
    return res.json(data)

  } catch (error) {
    console.error(error)
    res.status(500).json({
      icon: "fa-solid fa-triangle-exclamation",
      message: "[ERRO] Ocorreu um erro ao carregar os dados guardados!"
    })
  }
})

app.delete('/storage', async (req, res) => {
  try {
    const { favoriteToDelete } = req.body
    if (!favoriteToDelete) {
      return res.status(400).json({ message: '[ERROR] Missing required value: favorite_id' })
    }
    const deleteFavorite = await pool.query('DELETE FROM favorites WHERE user_id = $1 AND favorite_id = $2', [req.session.user.id, favoriteToDelete])

    return res.status(200).json({ message: '[SUCCESS] Favorite removed' })
  } catch (error) {
    return res.status(500).json({ message: '[ERRO] Ocorreu um erro ao eliminar um favorito' })
  }
})

app.put('/storage/order', async (req, res) => {
  try {
    const { updatedOrder } = req.body

    if (!updatedOrder || !Array.isArray(updatedOrder)) {
      return res.status(400).json({
        message: '[ERROR] Invalid updated order'
      })
    }

    for (const item of updatedOrder) {
      await pool.query(
        `
        UPDATE favorites
        SET position = $1
        WHERE user_id = $2
        AND favorite_id = $3
        `,
        [
          item.position,
          req.session.user.id,
          item.favorite_id
        ]
      )
    }

    res.status(200).json({
      message: '[SUCCESS] Favorites order updated'
    })

  } catch (error) {
    console.error(error.stack)
    res.status(500).json({
      message: '[SERVER] Failed to update favorites order'
    })
  }
})

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});