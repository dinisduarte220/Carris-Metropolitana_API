const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const storageFilePath = path.join(__dirname, 'JSON', 'storage.json');
const settingsFilePath = path.join(__dirname, 'JSON', 'settings.json');

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

// Servir ficheiros estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`\nServer is running\n\nhttp://localhost:${PORT}`);
});