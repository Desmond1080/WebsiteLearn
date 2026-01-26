const appointmentList = document.getElementById('appointment-list');
const appointmentStatusList = document.getElementById('appointment-list-booking-status');

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

//show pending status appointments
async function showpendingStatus(){
    appointmentList.innerHTML = '<p>Pending Status</p>';
    
    const user = auth.currentUser;
    const userId = user ? user.uid : null;

    if(!user){
        appointmentList.innerHTML = '<p>Please log in to view your appointments.</p>';
        return;
    }

    try{
        await db.collection("Appointments").where("userId", 
            "==", userId).where("status", "==", "Pending").orderBy("appointmentDate", "asc").get().then((querySnapshot) => {
            appointmentList.innerHTML = ""; // Clear previous results

            if(querySnapshot.empty){
                appointmentList.innerHTML = '<p>No pending appointments found.</p>';
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
        console.error("Error displaying pending appointments: ", error);
        appointmentList.innerHTML = '<p>Error loading pending appointments. Please try again.</p>';
    }

}


//show completed status appointments
async function showcompletedStatus(){
    appointmentList.innerHTML = '<p>Completed Status</p>';

    const user = auth.currentUser;
    const userId = user ? user.uid : null;

    if(!user){
        appointmentList.innerHTML = '<p>Please log in to view your appointments.</p>';
        return;
    }
    
    try{
        await db.collection("Appointments").where("userId", "==", userId).where("status", "==", "Completed").orderBy("appointmentDate", "asc").get().then((querySnapshot) => {
            appointmentList.innerHTML = ""; // Clear previous results

            if(querySnapshot.empty){
                appointmentList.innerHTML = '<p>No completed appointments found.</p>';
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
        console.error("Error displaying completed appointments: ", error);
        appointmentList.innerHTML = '<p>Error loading completed appointments. Please try again.</p>';
    }
}

// fetch and display appointments for the logged-in user
// identify what button is clicked to filter status
async function displayAppointments(){
    const user = auth.currentUser;
    const userId = user ? user.uid : null;
    
    if(!user){
        appointmentList.innerHTML = '<p>Please log in to view your appointments.</p>';
        return;
    }

    try{
        if(onclick="showpendingStatus()"){
            showpendingStatus();
            return;
        }else if(onclick="showcompletedStatus()"){
            showcompletedStatus();
            return;
        }
    } catch(error){
        console.error("Error displaying appointments: ", error);
        appointmentList.innerHTML = '<p>Error loading appointments. Please try again.</p>';
    }

}