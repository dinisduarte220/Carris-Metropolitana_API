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

// Lines Endpoint - Details for a specific Line
app.use('/lines/:line_id', express.static(path.join(__dirname, 'public', 'endpoints', 'lines', 'line_id')))
// app.use('/lines/:line_id?pattern=:pattern&active_stop=:stop_id&date=:date')

// Stops Endpoint - Details for a specific Stop
app.use('/stops/:stop_id', express.static(path.join(__dirname, 'public', 'endpoints', 'stops', 'stop_id')))

// Storage Endpoints - Get & Store
let localStorage = { storage: {}, settings: {} }

function readFileOrLocalStorage(filePath, key) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    } else {
      return localStorage[key]
    }
  } catch (error) {
    console.error(error)
    return localStorage[key]
  }
}

function writeFileOrLocalStorage(filePath, key, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(error)
    localStorage[key] = data
  }
}

app.get('/storage', (req, res) => {
  try {
    const storage = readFileOrLocalStorage(storageFilePath, 'storage')
    const storageId = req.query.storage_id

    if (storageId) {
      if (storage.hasOwnProperty(storageId)) {
        return res.json(storage[storageId])
      } else {
        return res.status(404).json({ error: `[ERROR] Storage ID "${storageId}" not found` })
      }
    } else {
      return res.json(storage)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "[ERRO] Ocorreu um erro ao carregar os dados guardados!" })
  }
})

app.post('/storage', (req, res) => {
  try {
    const storage = readFileOrLocalStorage(storageFilePath, 'storage')
    const { storage_id, value } = req.body

    if (!storage_id || !value) {
      return res.status(400).json({ error: '[ERROR] Missing required fields: storage_id and value' })
    }

    storage[storage_id] = value
    writeFileOrLocalStorage(storageFilePath, 'storage', storage)

    res.json({ message: '[SUCCESS] Dados atualizados com sucesso!', storage_id, value })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '[ERRO] Ocorreu um erro ao processar os dados!' })
  }
})

app.get('/settings', (req, res) => {
  try {
    const settings = readFileOrLocalStorage(settingsFilePath, 'settings')
    res.json(settings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "[ERRO] Ocorreu um erro ao carregar as configurações!" })
  }
})

app.post('/settings', (req, res) => {
  try {
    let settings = readFileOrLocalStorage(settingsFilePath, 'settings')
    const updates = req.body

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: '[ERROR] Invalid or missing settings update data' })
    }

    settings = { ...settings, ...updates }
    writeFileOrLocalStorage(settingsFilePath, 'settings', settings)

    res.json({ message: '[SUCCESS] Configurações atualizadas com sucesso!', settings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '[ERRO] Ocorreu um erro ao processar as configurações!' })
  }
})

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});