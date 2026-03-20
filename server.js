const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000

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

// Storage Endpoints - Get & Store
app.get('/storage', (req, res) => {
  try {
    const data = fs.readFileSync(storageFilePath, 'utf8')
    const storage = JSON.parse(data)

    if (!Array.isArray(storage)) {
      return res.status(500).json({
        icon: "fa-solid fa-triangle-exclamation",
        message: "[ERRO] O formato dos dados guardados é inválido!"
      })
    }

    const queryId = req.query.id

    if (queryId) {
      const item = storage.find(entry => entry.id === queryId)
      if (item) {
        return res.json(item)
      } else {
        return res.status(404).json({
          error: `[ERROR] Item with ID "${queryId}" not found`
        })
      }
    }

    // No ID: return all stored items
    return res.json(storage)

  } catch (error) {
    console.error(error)
    res.status(500).json({
      icon: "fa-solid fa-triangle-exclamation",
      message: "[ERRO] Ocorreu um erro ao carregar os dados guardados!"
    })
  }
})

app.post('/storage', (req, res) => {
  try {
    const { value } = req.body

    if (!value) {
      return res.status(400).json({
        error: '[ERROR] Missing required field: value'
      })
    }

    // Read and parse the file; fallback to an empty array if invalid
    let storage = []
    try {
      const data = fs.readFileSync(storageFilePath, 'utf8')
      storage = JSON.parse(data)
      if (!Array.isArray(storage)) storage = []
    } catch {
      storage = []
    }

    // Optional: prevent duplicate IDs
    const exists = storage.find(item => item.id === value.id)
    if (exists) {
      return res.status(409).json({
        message: '[INFO] Item with this ID already exists.',
        id: value.id
      })
    }

    // Add new item
    storage.push(value)

    // Save to file
    try {
      fs.writeFileSync(storageFilePath, JSON.stringify(storage, null, 2))
      res.json({
        message: '[SUCCESS] Dados adicionados com sucesso!',
        value: value
      })
    } catch (writeError) {
      console.error(writeError)
      res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao guardar os dados!'
      })
    }
  } catch (readError) {
    console.error(readError)
    res.status(500).json({
      icon: 'fa-solid fa-triangle-exclamation',
      message: '[ERRO] Ocorreu um erro ao processar os dados!'
    })
  }
})

app.put('/storage', (req, res) => {
  try {
    const { value } = req.body

    if (!Array.isArray(value)) {
      return res.status(400).json({
        error: '[ERROR] Expected an array of items in "value"'
      })
    }

    // Save the new array to the file
    fs.writeFileSync(storageFilePath, JSON.stringify(value, null, 2))

    res.json({
      message: '[SUCCESS] Ordem dos favoritos atualizada com sucesso!',
      value: value
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      icon: 'fa-solid fa-triangle-exclamation',
      message: '[ERRO] Ocorreu um erro ao atualizar os dados!'
    })
  }
})


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

// MongoDB
// const { MongoClient } = require('mongodb')
// const client = new MongoClient(process.env.MONGO_URI)

// app.post('/db/favorites', async (req, res) => {
  
// })

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});