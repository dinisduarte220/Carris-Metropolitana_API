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
// Stops Endpoint - Details for a specific Stop
app.use('/stops/:stop_id', express.static(path.join(__dirname, 'public', 'endpoints', 'stops', 'stop_id')))

// Storage Endpoints - Get & Store
app.get('/storage', (req, res) => {
    try {
        const data = fs.readFileSync(storageFilePath, 'utf8')
        const storage = JSON.parse(data)
        const storageId = req.query.storage_id

        if (storageId) {
            // Check if provided storage ID exists
            if (storage.hasOwnProperty(storageId)) {
                const result = storage[storageId]
                return res.json(result)
            } else {
                return res.status(404).json({ error: `[ERROR] Storage ID "${storageId}" not found` })
            }
        } else {
            // Return all data as arrays if no specific storageId is provided
            const allDataAsArrays = Object.fromEntries(
                Object.entries(storage).map(([key, value]) => [key, value])
            )
            return res.json(allDataAsArrays)
        }
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
    const data = fs.readFileSync(storageFilePath, 'utf8')
    const storage = JSON.parse(data)
    const { storage_id, value } = req.body

    // Validar campos obrigatórios
    if (!storage_id || !value) {
      return res.status(400).json({
        error: '[ERROR] Missing required fields: storage_id and value'
      })
    }

    // Atualizar o armazenamento
    storage[storage_id] = value

    try {
      fs.writeFileSync(storageFilePath, JSON.stringify(storage, null, 2))
      res.json({
        message: '[SUCCESS] Dados atualizados com sucesso!',
        storage_id: storage_id,
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

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});