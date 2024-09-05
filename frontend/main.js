// function checkServiceArea() {
//     const form = document.getElementById('userForm');
//     const userAddress = `${form.address.value}, ${form.zipCode.value}`;

//     const url = `http://localhost:8000/distance?destination=${encodeURIComponent(userAddress)}`;

//     fetch(url)
//         .then(response => response.json())
//         .then(data => {
//             const distanceInMeters = data.rows[0].elements[0].distance.value;
//             const distanceInMiles = distanceInMeters * 0.000621371;
//             const maxDistanceMiles = 10;

//             if (distanceInMiles <= maxDistanceMiles) {
//                 document.getElementById('result').innerText = `You are within our service area! (${distanceInMiles.toFixed(2)} miles)`;
//             } else {
//                 document.getElementById('result').innerText = `Sorry, you are outside our service area. (${distanceInMiles.toFixed(2)} miles)`;
//             }
//         })
//         .catch(error => console.error('Error:', error));
// }
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

