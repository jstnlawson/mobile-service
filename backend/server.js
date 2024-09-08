require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json()); // Handles JSON payloads directly in Express 4.16.0+

// Path to the Google Calendar service account key
const calendarKeyPath = process.env.GOOGLE_CALENDAR_KEY_PATH;
const calendarKey = JSON.parse(fs.readFileSync(path.resolve(__dirname, calendarKeyPath)));

// Initialize JWT client for the service account
const auth = new google.auth.JWT({
  email: calendarKey.client_email,
  key: calendarKey.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar']
});

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth });

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

function convertTo24Hour(time) {
  const [timePart, modifier] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  
  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  }
  
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }

  if (hours.length === 1) {
    hours = '0' + hours;
  }

  return `${hours}:${minutes}`;
}

app.post('/schedule', async (req, res) => {
  const { date, time } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: 'Missing required fields: date or time' });
  }

  const time24Hour = convertTo24Hour(time);

  const event = {
    summary: 'Scheduled Appointment',
    start: {
      dateTime: `${date}T${time24Hour}:00`,
      timeZone: 'America/Chicago',
    },
    end: {
      dateTime: `${date}T${time24Hour}:59`,
      timeZone: 'America/Chicago',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });
    res.status(200).json({ message: 'Appointment scheduled successfully', event: response.data });
  } catch (error) {
    console.error('Error scheduling appointment:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

app.get('/availableTimes', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const startOfDay = new Date(`${date}T00:00:00-06:00`);
  const endOfDay = new Date(`${date}T23:59:59-06:00`);

  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    // Log fetched events
    console.log('Fetched Events:', events);

    // Convert hour to time string format
const hourToTimeString = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${period}`;
};

  // Extract busy times
const busyTimes = new Set();
events.forEach(event => {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  // Convert start and end times to hours
  const startHour = start.getHours();
  const endHour = end.getHours();

  // Add all hours between start and end to busyTimes
  for (let hour = startHour; hour <= endHour; hour++) {
    if (hour >= 8 && hour <= 15) { // Only consider hours between 8 AM and 3 PM
      busyTimes.add(hour);
    }
  }
});

    // Log busy times
    console.log('Busy Times:', Array.from(busyTimes));

    const busyTimesStrings = Array.from(busyTimes).map(hourToTimeString);

    console.log('Busy Times (Strings):', busyTimesStrings);

    // Define available time slots
    const allTimeSlots = [
      '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'
    ];

    // Filter out busy times
    const availableTimes = allTimeSlots.filter(time => !busyTimesStrings.includes(time));

    // Log available times
    console.log('Available Times:', availableTimes);

    if (availableTimes.length === 0) {
      console.log('No available time slots for the selected date.');
    }

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error('Error fetching busy times:', error);
    res.status(500).json({ error: 'Failed to fetch busy times' });
  }
});



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
