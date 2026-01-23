const appointmentList = document.getElementById('appointment-list');

// Wait for user authentication, then load appointments
auth.onAuthStateChanged((user) => {
    if (user) {
        loadAppointments();
    } else {
        appointmentList.innerHTML = '<p>Please log in to view your appointments.</p>';
    }
});

//load and display appointments
function loadAppointments(){
    displayAppointments();
}

// fetch and display appointments for the logged-in user
async function displayAppointments(){
    const user = auth.currentUser;
    const userId = user ? user.uid : null;
    
    if(!user){
        appointmentList.innerHTML = '<p>Please log in to view your appointments.</p>';
        return;
    }
    
    appointmentList.innerHTML = '<p>Loading appointments...</p>';
    
    try{
        await db.collection("Appointments").where("userId", "==", userId).orderBy("appointmentDate", "asc").get().then((querySnapshot) => {
            appointmentList.innerHTML = ""; // Clear previous results
            
            if(querySnapshot.empty){
                appointmentList.innerHTML = '<p>No appointments found.</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const appointmentData = doc.data();
                const appointmentItem = `
                    <div class="appointment-item">
                        <h3>Appointment's Doctor: ${appointmentData.doctorName}</h3>
                        <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
                        <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
                        <p><strong>Reason:</strong> ${appointmentData.appointmentReason}</p>
                        <p><strong>Status:</strong> ${appointmentData.status}</p>
                        <hr>
                    </div>
                `;
                appointmentList.innerHTML += appointmentItem;
            });
        });
    }catch(error){
        console.error("Error displaying appointments: ", error);
        appointmentList.innerHTML = '<p>Error loading appointments. Please try again.</p>';
    }
}