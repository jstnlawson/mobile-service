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
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json()); // To parse JSON bodies

console.log('Google API Key:', process.env.GOOGLE_MAP_KEY);

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

// Path to the service account key
const calendarKeyPath = process.env.GOOGLE_CALENDAR_KEY_PATH;
const calendarKey = JSON.parse(fs.readFileSync(path.resolve(__dirname, calendarKeyPath)));
// console.log('Google Calendar Key:', calendarKey);

// Initialize JWT client for the service account
const auth = new google.auth.JWT({
  email: calendarKey.client_email,
  key: calendarKey.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar']
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth });

// Endpoint to schedule an appointment
app.post('/schedule', async (req, res) => {
  const { date, time, description } = req.body;

  if (!date || !time || !description) {
    return res.status(400).json({ error: 'Missing required fields: date, time, or description' });
  }

  // Construct the event details using the appointment data from the frontend
  const event = {
    summary: 'Scheduled Appointment',
    description: description,
    start: {
      dateTime: `${date}T${time}:00`, // Combine date and time, assuming time is in HH:mm format
      timeZone: 'America/Chicago',    // Set the timezone as needed
    },
    end: {
      dateTime: `${date}T${time}:59`, // End time (assuming 1-hour event)
      timeZone: 'America/Chicago',
    },
    // I removed the attendees because this requires the user to be invited
    // I should add a requirement the user has paid for service before the schedule is 
    // officially added to the calendar 
    // attendees: [
    //   { email: 'example@example.com' } // Can modify to include other attendees if necessary
    // ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // Email reminder 24 hours before
        { method: 'popup', minutes: 10 }       // Popup reminder 10 minutes before
      ],
    },
  };

  try {
    // Insert the event into the Google Calendar
    const response = await calendar.events.insert({
      calendarId: '316aa9023dfd86ff61f9cbf69e7a9f8977c619e766e4985be60d7258f399ed8c@group.calendar.google.com', // Replace with your specific calendar ID if not using the primary calendar
      resource: event,
    });
    res.status(200).json({ message: 'Appointment scheduled successfully', event: response.data });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
