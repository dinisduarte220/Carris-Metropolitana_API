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
app.get('/storage' , (req , res)=>{
    try {
        const data = fs.readFileSync(storageFilePath, 'utf8')
        const storage = JSON.parse(data)
        const storageId = req.query.storage_id

        if (storageId) {
            // Check if provided storage ID exists
            if (storage.hasOwnProperty(storageId)) {
                return res.json({ [storageId]: storage[storageId] });
            } else {
                return res.status(404).json({ error: `[ERROR] Storage ID "${storageId}" not found` });
            }
        } else {
            // If no storage ID is provided, return full data
            return res.json(storage)
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            icon: "fa-solid fa-triangle-exclamation",
            message: "[ERRO] Ocorreu um erro ao carregar os dados guardados"
        });
    }
})

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});