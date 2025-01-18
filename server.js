const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const possiblePaths = ["home", "lines", "stops", "settings"]
app.use(bodyParser.json());

// Define Storage and Settings files locations
const storageFilePath = path.join(__dirname, 'JSON', 'storage.json');
const settingsFilePath = path.join(__dirname, 'JSON', 'settings.json');

// Check paths
possiblePaths.forEach((route) => {
    app.use(`/page/${route}`, express.static(path.join(__dirname, 'public/endpoints', route)));
});
app.get('/page/:path' , (req , res)=>{
    var userPath = req.params.path
    if (!possiblePaths.includes(userPath)) {
        res.status(404).send("Caminho Inválido");
    } else {
        res.status(404).send("Diretório não encontrado");
    }
})

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
        // Check if a storage ID and a value were provided
        if (!storage_id || !value) {
            return res.status(400).json({
                error: '[ERROR] Missing required fields: storage_id and value'
            })
        }
        // Store new value
        storage[storage_id] = value
        fs.writeFileSync(storageFilePath, JSON.stringify(storage, null, 2))
        res.json({
            message: '[SUCCESS] Dados atualizados com sucesso!',
            storage_id: storage_id,
            value: value
        })
    } catch (error) {
        // Error Handler
        console.error(error)
        res.status(500).json({
            icon: 'fa-solid fa-triangle-exclamation',
            message: '[ERRO] Ocorreu um erro ao guardar os dados!'
        })
    }
})

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});