
function checkServiceArea() {
    const form = document.getElementById('userForm');
    const userAddress = `${form.address.value}, ${form.zipCode.value}`;

    const url = `http://localhost:8000/distance?destination=${encodeURIComponent(userAddress)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data); // Log the response to debug

            if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
                const distanceInMeters = data.rows[0].elements[0].distance.value;
                const distanceInMiles = distanceInMeters * 0.000621371;
                const maxDistanceMiles = 10;

                if (distanceInMiles <= maxDistanceMiles) {
                    document.getElementById('result').innerText = `You are within our service area! (${distanceInMiles.toFixed(2)} miles)`;
                } else {
                    document.getElementById('result').innerText = `Sorry, you are outside our service area. (${distanceInMiles.toFixed(2)} miles)`;
                }
            } else {
                document.getElementById('result').innerText = 'Invalid response from API.';
            }
        })
        .catch(error => console.error('Error:', error));
}

// function scheduleAppointment() {
//     const form = document.getElementById('scheduleForm');
//     const date = form.date.value;
//     const time = form.time.value;
//     const description = form.description.value;

//     const appointment = { date, time, description };

//     fetch('http://localhost:8000/schedule', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(appointment),
//     })
//     .then(response => {
//         if (!response.ok) {
//             // If the response is not OK, return the status text
//             throw new Error(`Server error: ${response.statusText}`);
//         }
//         return response.json(); // Try to parse JSON only if the response is OK
//     })
//     .then(data => {
//         console.log('Appointment scheduled:', data);
//         alert('Appointment scheduled successfully!');
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         alert('An error occurred: ' + error.message);
//     });
// }
// document.addEventListener('DOMContentLoaded', function() {
// document.getElementById('date').addEventListener('input', function() {
//     const selectedDate = new Date(this.value);
//     const dayOfWeek = selectedDate.getUTCDay(); // Get day of the week (0 = Sunday, 6 = Saturday)
//     const currentDate = new Date(); // Get the current date

//     const dateInput = document.getElementById('date');
//     const errorMessage = document.getElementById('error-message');

//     // Change background color if it's a weekend
//     if (dayOfWeek === 6 || dayOfWeek === 0) {
//         this.style.backgroundColor = 'lightcoral'; // Red for weekends

//         errorMessage.textContent = 'Weekends are not selectable. Please choose a weekday.';
//             errorMessage.style.display = 'block';
//             this.value = ''; // Clear the input field

//     } else if (selectedDate < currentDate) {
//         this.style.backgroundColor = 'lightcoral'; // Red for past dates

//         errorMessage.textContent = 'Past dates are not selectable. Please choose a future date.';
//             errorMessage.style.display = 'block';
//             this.value = ''; // Clear the input field
//     } else {
//         this.style.backgroundColor = 'lightgreen'; // Green for weekdays

//         errorMessage.textContent = '';
//             errorMessage.style.display = 'none';

//     }
// });
// });

function scheduleAppointment() {
    const form = document.getElementById('scheduleForm');
    const date = form.date.value;
    const time = form.timeSlots.value; // Use the select element for time
    // const description = form.description.value; // (No description as per your request)

    const appointment = { date, time };

    fetch('http://localhost:8000/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Appointment scheduled:', data);
        alert('Appointment scheduled successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const errorMessage = document.getElementById('error-message');
    const timeSelect = document.getElementById('timeSlots');
    const scheduleButton = document.querySelector('button[onclick="scheduleAppointment()"]');
    const scheduleErrorMsg = document.getElementById('scheduleErrorMsg');

    dateInput.addEventListener('input', async function() {
        const selectedDate = new Date(this.value);
        const dayOfWeek = selectedDate.getUTCDay();
        const currentDate = new Date();

        if (dayOfWeek === 6 || dayOfWeek === 0) {
            this.style.backgroundColor = 'lightcoral';
            errorMessage.textContent = 'Weekends are not selectable. Please choose a weekday.';
            errorMessage.style.display = 'block';
            this.value = '';
            timeSelect.innerHTML = '';
            timeSelect.style.display = 'none';
            scheduleButton.style.display = 'none';
            return;
        }

        if (selectedDate < currentDate) {
            this.style.backgroundColor = 'lightcoral';
            errorMessage.textContent = 'Past dates are not selectable. Please choose a future date.';
            errorMessage.style.display = 'block';
            this.value = '';
            timeSelect.innerHTML = '';
            timeSelect.style.display = 'none';
            scheduleButton.style.display = 'none';
            return;
        }

        this.style.backgroundColor = 'lightgreen';
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(`/availableTimes?date=${this.value}`);
            const data = await response.json();

            timeSelect.innerHTML = '';

            if (!data.availableTimes.length) {
                const option = document.createElement('option');
                option.textContent = 'No available time slots';
                option.disabled = true;
                timeSelect.appendChild(option);
                //timeSelect.style.display = 'block'; // Show the select element with message
                //scheduleButton.style.display = 'none'; // Hide the schedule button
                scheduleErrorMsg.style.display = 'block'; // Show the error message
                dateInput.style.backgroundColor = 'lightcoral'; // Change background color
            } else {
                data.availableTimes.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;
                    timeSelect.appendChild(option);
                });
                timeSelect.style.display = 'block'; // Show the select element
                scheduleButton.style.display = 'block'; // Show the schedule button
            }
        } catch (error) {
            console.error('Error fetching available times:', error);
            errorMessage.textContent = 'Failed to load available time slots. Please try again.';
            errorMessage.style.display = 'block';
        }
    });
});

