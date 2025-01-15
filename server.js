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

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});