// require('dotenv').config();

// console.log('Google API Key:', process.env.GOOGLE_MAP_KEY);

// const { google } = require('googleapis');

// const express = require('express');
// const path = require('path'); // Import the 'path' module

// const app = express();

// // Serve static files from the 'frontend' directory
// app.use(express.static(path.join(__dirname, '../frontend')));

// app.get('/distance', async (req, res) => {
//     const { default: fetch } = await import('node-fetch');

//     const apiKey = process.env.GOOGLE_MAP_KEY;
//     const origin = '5340 Bloomington Ave, Minneapolis MN 55417, USA';
//     const destination = req.query.destination;

//     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

//     try {
//         const response = await fetch(url);
//         const data = await response.json();
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Serve your HTML file at the root path
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });

// app.listen(8000, () => {
//     console.log('Server running on http://localhost:8000');
// });
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const express = require('express');

const app = express();

// Path to the service account key
const calendarKeyPath = process.env.GOOGLE_CALENDAR_KEY_PATH;
const calendarKey = JSON.parse(fs.readFileSync(path.resolve(__dirname, calendarKeyPath)));

// Initialize the Google Calendar API client
const calendar = google.calendar({ version: 'v3', auth: calendarKey });

// Set up Google Calendar API client
const calendarClient = oauth2Client.getClient();

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

// Example endpoint to add an event to the calendar
app.post('/addEvent', async (req, res) => {
  const event = {
    summary: 'New Event',
    location: 'Somewhere',
    description: 'Event description',
    start: {
      dateTime: '2024-10-01T10:00:00-07:00', // Adjust timezone and format as needed
    },
    end: {
      dateTime: '2024-10-01T11:00:00-07:00',
    },
    attendees: [
      { email: 'example@example.com' }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 }
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary', // Use 'primary' for the authenticated calendar or specify another calendar ID
      resource: event,
      auth: calendarClient
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
