// Get doctor ID from URL
const doctorId = getQueryParam('doctorId');
let doctorName = ''; // Store doctor name globally
let availableSlotsByDate = {};


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
            await loadAvailableSlots(docId);
        } else {
            document.getElementById('doctor-details').innerHTML = '<p>Doctor not found.</p>';
        }
    } catch (error) {
        console.error('Error loading doctor details:', error);
        document.getElementById('doctor-details').innerHTML = '<p>Error loading doctor information.</p>';
    }
}

// load available slots for the doctor and populate the date and time dropdowns
async function loadAvailableSlots(docId){
    const todayStr = new Date().toISOString().split('T')[0];
    try{
        const doctorRef = db.collection('Doctors').doc(docId);

        let slotDocs = [];

        // Primary query: current schema used across this project (doctorId as string, date/time fields)
        try {
            const stringIdQuery = await db.collection('Slots')
                .where('DoctorID', '==', docId)
                .where('status', '==', 'available')
                .where('RecurrStartDate', '>=', todayStr)
                .orderBy('RecurrStartDate')
                .orderBy('startTime')
                .get();

            console.log('Slots string-id query returned', stringIdQuery.size, 'documents');
            slotDocs = slotDocs.concat(stringIdQuery.docs);
        } catch (err) {
            console.warn('Slots string-id query failed, will try fallback schema:', err);
        }

        // Fallback query: alternative schema (DoctorId as reference, RecurrStartDate/startTime fields)
        try {
            const refIdQuery = await db.collection('Slots')
                .where('DoctorID', '==', doctorRef)
                .where('status', '==', 'available')
                .where('RecurrStartDate', '>=', todayStr)
                .orderBy('RecurrStartDate')
                .orderBy('startTime')
                .get();

            slotDocs = slotDocs.concat(refIdQuery.docs);
        } catch (err) {
            console.warn('Slots reference-id query failed:', err);
        }

        // Last-resort fallback: single-field query then filter/sort in JS (avoids composite index blockers)
        if(slotDocs.length === 0){
            try {
                const fallbackSnapshot = await db.collection('Slots')
                    .where('doctorId', '==', docId)
                    .get();
                slotDocs = fallbackSnapshot.docs;
            } catch (err) {
                console.warn('Slots fallback query failed:', err);
            }
        }

        availableSlotsByDate = {};
        const seenSlotIds = new Set();

        slotDocs.forEach(doc => {
            if(seenSlotIds.has(doc.id)){
                return;
            }
            seenSlotIds.add(doc.id);

            const slot = doc.data();
            const dateValue = slot.date || slot.RecurrStartDate;
            const timeValue = slot.time || slot.startTime;
            const statusValue = String(slot.status || '').toLowerCase();

            if(!dateValue || !timeValue){
                return;
            }

            if(dateValue < todayStr){
                return;
            }

            if(statusValue && statusValue !== 'available'){
                return;
            }

            if(!availableSlotsByDate[dateValue]){
                availableSlotsByDate[dateValue] = [];
            }

            availableSlotsByDate[dateValue].push({ id: doc.id, time: timeValue });
        });

        // Keep times ordered for each date
        Object.keys(availableSlotsByDate).forEach(dateKey => {
            availableSlotsByDate[dateKey].sort((a, b) => a.time.localeCompare(b.time));
        });

        // Populate date dropdown
        const dateSelect = document.getElementById('appointment-date');
        const timeSelect = document.getElementById('appointment-time');
        dateSelect.innerHTML = '<option value="" disabled selected>Select a date</option>';
        Object.keys(availableSlotsByDate).forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            dateSelect.appendChild(option);
        });

        if(Object.keys(availableSlotsByDate).length === 0){
            dateSelect.innerHTML = '<option value="" disabled selected>No available dates</option>';
        }

        timeSelect.innerHTML = '<option value="" disabled selected>Select a date first</option>';
        timeSelect.disabled = true;
    } catch(error){
        console.error('Error loading available slots:', error);
    }
}

// load times when date is selected
document.getElementById('appointment-date').addEventListener('change', function() {
    const selectedDate = this.value;
    const timeSelect = document.getElementById('appointment-time');
    const slots =  availableSlotsByDate[selectedDate] || [];

    timeSelect.innerHTML = '<option value="" disabled selected>Select a time</option>';
    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = slot.time;
        option.setAttribute('data-slot-id', slot.id);
        timeSelect.appendChild(option);
    });
    timeSelect.disabled = false;
});

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

// Date is controlled by available slot dropdown, so no native min-date setup is needed.

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
    const selectedTimeOption = document.getElementById('appointment-time').selectedOptions[0];
    const slotId = selectedTimeOption ? selectedTimeOption.getAttribute('data-slot-id') : null;

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
    if(patientName === "" || patientEmail === "" || appointmentDateValue === "" || appointmentTime === "" || !slotId){
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
        const existingBooking = await db.collection('Appointments')
            .where('doctorId', '==', doctorId)
            .where('appointmentDate', '==', appointmentDateValue)
            .where('appointmentTime', '==', appointmentTime)
            .where('status', 'in', ['Pending', 'booked'])
            .get();

        if(!existingBooking.empty){
            alert('The selected slot is no longer available. Please choose another slot.');
            await loadAvailableSlots(doctorId);
            return;
        }

        const slotRef = db.collection('Slots').doc(slotId);
        let createdAppointmentId = null;

        await db.runTransaction(async (transaction) => {
            const slotDoc = await transaction.get(slotRef);

            if(!slotDoc.exists || slotDoc.data().status !== 'available'){
                throw new Error('Selected slot is no longer available. Please choose another slot.');
            }

            const appointmentRef = db.collection('Appointments').doc();
            createdAppointmentId = appointmentRef.id;

            transaction.set(appointmentRef, appointmentData);
            transaction.update(slotRef, {
                status: 'booked',
                bookedByUserId: userId,
                appointmentId: createdAppointmentId
            });
        });
        
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
        await loadAvailableSlots(doctorId);
        return;
    }catch(error){
        console.error("Error booking appointment: ", error);
        alert("Error booking appointment. Please try again.");
    }

});
