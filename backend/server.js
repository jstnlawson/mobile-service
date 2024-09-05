require('dotenv').config();

const express = require('express');
const path = require('path'); // Import the 'path' module

const app = express();

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/distance', async (req, res) => {
    const { default: fetch } = await import('node-fetch');

    const apiKey = process.env.GOOGLE_MAP_KEY;
    const origin = '5340 Bloomington Ave, Minneapolis MN 55417, USA';
    const destination = req.query.destination;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve your HTML file at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(8000, () => {
    console.log('Server running on http://localhost:8000');
});
