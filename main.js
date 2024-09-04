const serviceAreaOrigin = '5340 Bloomington Ave, Minneapolis MN 55417, USA'; // Your service area center
const apiKey = 'GOOGLE_MAP_KEY';

function checkServiceArea() {
    const form = document.getElementById('userForm');
    const userAddress = `${form.address.value}, ${form.zipCode.value}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(serviceAreaOrigin)}&destinations=${encodeURIComponent(userAddress)}&key=${apiKey}`;

    fetch(url)
            .then(response => response.json())
            .then(data => {
                const distanceInMeters = data.rows[0].elements[0].distance.value; // Distance in meters
                const distanceInMiles = distanceInMeters * 0.000621371; // Convert to miles
                const maxDistanceMiles = 10; // Define your max service area distance in miles

                if (distanceInMiles <= maxDistanceMiles) {
                    document.getElementById('result').innerText = `You are within our service area! (${distanceInMiles.toFixed(2)} miles)`;
                } else {
                    document.getElementById('result').innerText = `Sorry, you are outside our service area. (${distanceInMiles.toFixed(2)} miles)`;
                }
            })
            .catch(error => console.error('Error:', error));
    }