// Get doctor ID from URL
const doctorId = getQueryParam('doctorId');
let doctorName = ''; // Store doctor name globally


// Function to get query parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in, pre-fill their information
        document.getElementById('patient-email').value = user.email || '';
        if (user.displayName) {
            document.getElementById('patient-name').value = user.displayName;
        }
    }
});

// Load doctor details
if (doctorId) {
    loadDoctorDetails(doctorId);
} else {
    document.getElementById('doctor-details').innerHTML = '<p>No doctor selected. Please go back and select a doctor.</p>';
}

// Function to load doctor details from Firebase
async function loadDoctorDetails(docId) {
    try {
        const doctorDoc = await db.collection('Doctors').doc(docId).get();
        
        if (doctorDoc.exists) {
            const doctor = doctorDoc.data();
            displayDoctorDetails(doctor);
            // Show the appointment form
            document.getElementById('appointment-form-container').style.display = 'block';
        } else {
            document.getElementById('doctor-details').innerHTML = '<p>Doctor not found.</p>';
        }
    } catch (error) {
        console.error('Error loading doctor details:', error);
        document.getElementById('doctor-details').innerHTML = '<p>Error loading doctor information.</p>';
    }
}

// Function to display doctor details
function displayDoctorDetails(doctor) {
    // Store doctor name globally so we can use it in the form
    doctorName = doctor.name;
    
    const doctorDetailsDiv = document.getElementById('doctor-details');
    doctorDetailsDiv.innerHTML = `
        <div class="doctor-info">
            <img src="${doctor.imageUrl}" alt="${doctor.name}" class="doctor-image-large">
            <h1>${doctor.name}</h1>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Room:</strong> ${doctor.room}</p>
            <br>
            <h2>About Me</h2>
            <p>${doctor.description}</p>
        </div>
    `;
}

function closeEmptyAppointmentFieldPopout(){
    document.getElementById('check-empty-appointment-field').style.display = 'none';
    document.getElementById('appointment-content').style.filter = 'none';
    document.body.style.overflow = 'auto'; // Enable background scrolling
}

function closeAppointmentSuccessMessage(){
    document.getElementById('appointment-success-message').style.display = 'none';
    document.getElementById('appointment-content').style.filter = 'none';
    document.body.style.overflow = 'auto'; // Enable background scrolling
    window.location.href = '../Doctor/DoctorList.html'; // Redirect after user closes
}

// set minimum date for appointment date input to today
const appointmentDate = document.getElementById('appointment-date');
const today = new Date().toISOString().split('T')[0];
appointmentDate.min = today;

// Handle appointment form submission
const appointmentForm = document.getElementById('appointment-form');
const trydisbaledDate = ["2026-01-28"];
appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const patientName = document.getElementById('patient-name').value;
    const patientEmail = document.getElementById('patient-email').value;
    const appointmentDateValue = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const appointmentReason = document.getElementById('appointment-reason').value;

    const user = auth.currentUser;
    const userId = user ? user.uid : null;

    const appointmentData = {
        doctorId: doctorId,
        doctorName: doctorName,
        patientName: patientName,
        patientEmail: patientEmail,
        appointmentDate: appointmentDateValue,
        appointmentTime: appointmentTime,
        appointmentReason: appointmentReason,
        status: 'Pending',
        userId: userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }

    // Validate that all required fields are filled
    if(patientName === "" || patientEmail === "" || appointmentDateValue === "" || appointmentTime === ""){
        // Show the empty field error message
        document.getElementById('appointment-content').style.filter = 'blur(5px)';
        document.getElementById('check-empty-appointment-field').style.display = 'block';
        document.body.style.overflow = 'hidden'; // Disable background scrolling
        return;
    }

    if(trydisbaledDate.includes(appointmentDateValue)){
        alert("The selected date is not available. Please choose another date.");
        return;
    }

    try{
        // Save appointment to database
        await db.collection("Appointments").add(appointmentData);
        
        // Create notification for the user
        await db.collection("Notifications").add({
            userId: userId,
            title: "Appointment Booked Successfully!",
            message: `Your appointment with Dr. ${doctorName} on ${appointmentDateValue} at ${appointmentTime} has been confirmed. You will receive a confirmation shortly.`,
            isRead: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });


        // Show success message
        document.getElementById('appointment-form').reset(); // Reset form fields
        document.getElementById('appointment-success-message').style.display = 'block';
        document.getElementById('appointment-content').style.filter = 'blur(5px)';
        document.body.style.overflow = 'hidden'; // Disable background scrolling
        return;
    }catch(error){
        console.error("Error booking appointment: ", error);
        alert("Error booking appointment. Please try again.");
    }

});
