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

function convertTo24Hour(time) {
  const [timePart, modifier] = time.split(' '); // Split the time and AM/PM part
  let [hours, minutes] = timePart.split(':');  // Split the hour and minutes
  
  if (modifier === 'PM' && hours !== '12') {
      hours = parseInt(hours, 10) + 12;
  }
  
  if (modifier === 'AM' && hours === '12') {
      hours = '00'; // Midnight case
  }

  // Ensure the hours have leading zeroes if necessary
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

  const time24Hour = convertTo24Hour(time); // Convert the time to 24-hour format

  // Construct the event details using the appointment data from the frontend
  const event = {
    summary: 'Scheduled Appointment',
    start: {
      dateTime: `${date}T${time24Hour}:00`, // Combine date and time
      timeZone: 'America/Chicago',
    },
    end: {
      dateTime: `${date}T${time24Hour}:59`, // End time (assuming 1-hour event)
      timeZone: 'America/Chicago',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // Email reminder 24 hours before
        { method: 'popup', minutes: 10 },      // Popup reminder 10 minutes before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: '316aa9023dfd86ff61f9cbf69e7a9f8977c619e766e4985be60d7258f399ed8c@group.calendar.google.com', 
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

  // Define the start and end of the day for the selected date
  const startOfDay = new Date(`${date}T00:00:00-06:00`); // Adjust time zone if necessary
  const endOfDay = new Date(`${date}T23:59:59-06:00`);

  try {
    const response = await calendar.events.list({
      calendarId: '316aa9023dfd86ff61f9cbf69e7a9f8977c619e766e4985be60d7258f399ed8c@group.calendar.google.com',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    // Extract busy times from events (start and end hours)
    const busyTimes = events.map(event => ({
      start: new Date(event.start.dateTime).getHours(),
      end: new Date(event.end.dateTime).getHours()
    }));

    // Define all possible time slots for a typical business day (e.g., 8:00 AM to 4:00 PM)
    const allTimeSlots = [
      '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'
    ];

    // Filter out the busy time slots from the available time slots
    const availableTimes = allTimeSlots.filter(slot => {
      const slotHour = new Date(`1970-01-01T${slot}`).getHours(); // Convert slot time to hour
      return !busyTimes.some(busy => slotHour >= busy.start && slotHour < busy.end); // Remove busy slots
    });

    res.status(200).json({ availableTimes });
  } catch (error) {
    console.error('Error fetching busy times:', error);
    res.status(500).json({ error: 'Failed to fetch busy times' });
  }
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
