const searchInput = document.getElementById('search-input');
const doctorListContainer = document.getElementById('doctor-list-container');
const doctorCards = doctorListContainer.getElementsByClassName('doctor-card');

searchInput.addEventListener('keyup', searchDoctors);

async function searchDoctors() {
    const filter = searchInput.value.toLowerCase();
    try{
        await db.collection("Doctors").get().then((querySnapshot) => {
            doctorListContainer.innerHTML = ""; // Clear previous results
            querySnapshot.forEach((doc) => {
                const doctorData = doc.data();
                const name = doctorData.name;
                const specialization = doctorData.specialization;
                const room = doctorData.room;
                if (name.toLowerCase().includes(filter) || specialization.toLowerCase().includes(filter) || room.toLowerCase().includes(filter)) {
                    const doctorCard = `
                        <div class="doctor-card">
                            <img src="${doctorData.imageUrl}" class="doctor-image">
                            <h3 class="doctor-name">${name}</h3>
                            <p class="doctor-specialty">Specialization: ${specialization}</p>
                            <p class="doctor-room">Room: ${room}</p>
                        </div>
                    `;
                    doctorListContainer.innerHTML += doctorCard;
                }});
            });
    } catch(error){
        console.error("Error searching doctors: ", error);
    }
}

// display doctor cards that match the search result or all if search is empty
async function displayDoctors(){
    const filter = searchInput.value.toLowerCase();
    try{
        await db.collection("Doctors").get().then((querySnapshot) => {
            doctorListContainer.innerHTML = ""; // Clear previous results
            querySnapshot.forEach((doc) => {
                const doctorData = doc.data();
                const name = doctorData.name;
                const specialization = doctorData.specialization;
                const room = doctorData.room;
                if (filter === "" || name.toLowerCase().includes(filter) || specialization.toLowerCase().includes(filter) || room.toLowerCase().includes(filter)) {
                    const doctorCard = `
                        <div class="doctor-card">
                            <img src="${doctorData.imageUrl}" class="doctor-image">
                            <h3 class="doctor-name">${name}</h3>
                            <p class="doctor-specialty">Specialization: ${specialization}</p>
                            <p class="doctor-room">Room: ${room}</p>
                            <!-- book appointment button which redirects to the booking page with the doctorId as a query parameter -->
                            <button onclick="location.href='../Appointment/BookAppointment.html?doctorId=${doc.id}'" class="book-appointment-button">Book Appointment</button>
                        </div>
                    `;
                    doctorListContainer.innerHTML += doctorCard;
                }});
            });
    }catch(error){
        console.error("Error displaying doctors: ", error);
    }
}

// Initial display of all doctors
displayDoctors();