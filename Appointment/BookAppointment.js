// Get doctor ID from URL
const doctorId = getQueryParam('doctorId');
let doctorName = ''; // Store doctor name globally
let availableSlotsByDate = {};
let availableSlotsByMonth = {};
const RECURRING_PREVIEW_WEEKS = 12;

// Function to get query parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function toMonthKey(value){
    if(!value){
        return null;
    }

    if(typeof value === 'string'){
        return value.substring(0, 7); // Extract YYYY-MM
    }

    if(value instanceof Date){
        return value.toISOString().substring(0, 7);
    }

}

function monthLabel(monthKey){
    const [y, m] = monthKey.split('-').map(Number);
    const dt = new Date(y, m - 1, 1);
    return dt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function ensureMonthSelectExists(){
    let monthSelect = document.getElementById('appointment-month');
    if(monthSelect){
        return monthSelect;
    }

    const appointmentForm = document.getElementById('appointment-form');
    const dateSelect = document.getElementById('appointment-date');
    if(!appointmentForm || !dateSelect){
        return null;
    }

    const monthLabelEl = document.createElement('label');
    monthLabelEl.setAttribute('for', 'appointment-month');
    monthLabelEl.textContent = 'Appointment Month:';

    monthSelect = document.createElement('select');
    monthSelect.id = 'appointment-month';
    monthSelect.required = true;
    monthSelect.innerHTML = '<option value="" disabled selected>Select a month</option>';

    const spacer = document.createElement('br');

    appointmentForm.insertBefore(monthLabelEl, dateSelect.previousElementSibling || dateSelect);
    appointmentForm.insertBefore(monthSelect, dateSelect);
    appointmentForm.insertBefore(spacer, dateSelect);

    monthSelect.addEventListener('change', function() {
        renderDateOptionsForMonth(this.value);
    });

    console.log('ensureMonthSelectExists: recreated missing month select');
    return monthSelect;
}

// render month options
function renderMonthOptions(){
    const monthSelect = ensureMonthSelectExists();
    const dateSelect = document.getElementById('appointment-date');
    const timeSelect = document.getElementById('appointment-time');

    if(!monthSelect || !dateSelect || !timeSelect){
        console.log('renderMonthOptions: missing elements', {
            hasMonthSelect: !!monthSelect,
            hasDateSelect: !!dateSelect,
            hasTimeSelect: !!timeSelect
        });
        return;
    }

    monthSelect.innerHTML = '<option value="" disabled selected>Select a month</option>';
    const monthKeys = Object.keys(availableSlotsByMonth).sort();
    console.log('renderMonthOptions: month keys', monthKeys, availableSlotsByMonth);
    monthKeys.forEach(monthKey => {
        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = monthLabel(monthKey);
        monthSelect.appendChild(option);
    });

    if(monthKeys.length === 0){
        monthSelect.innerHTML = '<option value="" disabled selected>No available months</option>';
        dateSelect.innerHTML = '<option value="" disabled selected>No available dates</option>';
        timeSelect.innerHTML = '<option value="" disabled selected>Select a date first</option>';
        timeSelect.disabled = true;
    }
}

function renderTimeOptionsForDate(selectedDate, autoSelectFirstTime){
    const timeSelect = document.getElementById('appointment-time');
    if(!timeSelect){
        return;
    }

    const slots = availableSlotsByDate[selectedDate] || [];
    timeSelect.innerHTML = '<option value="" disabled selected>Select a time</option>';

    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = slot.time;
        option.setAttribute('data-slot-id', slot.id);
        if(slot.isRecurringTemplate){
            option.setAttribute('data-recurring-template-id', slot.templateSlotId);
            option.setAttribute('data-generated-date', slot.generatedDateKey);
        }
        timeSelect.appendChild(option);
    });

    timeSelect.disabled = slots.length === 0;

    if(autoSelectFirstTime && slots.length > 0){
        timeSelect.selectedIndex = 1;
    }
}

// render date for month 
function renderDateOptionsForMonth(monthKey, autoSelectFirstDate = true){
    const dateSelect = document.getElementById('appointment-date');
    const timeSelect = document.getElementById('appointment-time');

    if(!dateSelect || !timeSelect) return;

    dateSelect.innerHTML = '<option value="" disabled selected>Select a date</option>';
    const dates = (availableSlotsByMonth[monthKey] || []).sort();
    console.log('renderDateOptionsForMonth:', { monthKey, dates });
    dates.forEach(date => {
        // Format date nicely: YYYY-MM-DD -> e.g. "Mon, 18 Mar 2026"
        const [y, m, d] = date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const label = dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const option = document.createElement('option');
        option.value = date;
        option.textContent = label;
        dateSelect.appendChild(option);
    });
    if(dates.length === 0){
        dateSelect.innerHTML = '<option value="" disabled selected>No available dates</option>';
        timeSelect.innerHTML = '<option value="" disabled selected>Select a date first</option>';
        timeSelect.disabled = true;
        return;
    }

    if(autoSelectFirstDate){
        dateSelect.value = dates[0];
        renderTimeOptionsForDate(dates[0], true);
    } else {
        timeSelect.innerHTML = '<option value="" disabled selected>Select a date first</option>';
        timeSelect.disabled = true;
    }
}

function toDateKey(value){
    if(!value){
        return null;
    }

    if(typeof value === 'string'){
        return value;
    }

    if(value instanceof Date){
        return value.toISOString().split('T')[0];
    }

    // Firestore Timestamp (v8 compat): has toDate()
    if(typeof value.toDate === 'function'){
        return value.toDate().toISOString().split('T')[0];
    }

    return null;
}

function toDayIndex(dayOfWeekValue){
    if(dayOfWeekValue === undefined || dayOfWeekValue === null){
        return null;
    }

    if(typeof dayOfWeekValue === 'number' && dayOfWeekValue >= 0 && dayOfWeekValue <= 6){
        return dayOfWeekValue;
    }

    const normalized = String(dayOfWeekValue).trim().toLowerCase();
    const dayIndexMap = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };

    return dayIndexMap[normalized] !== undefined ? dayIndexMap[normalized] : null;
}

function firstMatchingDateOnOrAfterDateKey(startDateKey, targetDayIndex){
    const date = new Date(`${startDateKey}T00:00:00`);
    const diff = (targetDayIndex - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
}

function formatDateKeyFromDate(dateObj){
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isRecurringTemplateSlot(slot){
    return !slot.isRecurringGenerated && !!slot.dayOfWeek && !!(slot.RecurrStartDate || slot.date) && !!(slot.startTime || slot.time);
}

async function ensureConcreteSlotForRecurringTemplate(templateSlotId, selectedDateKey, selectedTime, selectedDoctorId){
    const slotKey = `${selectedDoctorId}_${selectedDateKey}_${selectedTime}`;

    const existingSlotSnapshot = await db.collection('Slots')
        .where('slotKey', '==', slotKey)
        .limit(1)
        .get();

    if(!existingSlotSnapshot.empty){
        return existingSlotSnapshot.docs[0].id;
    }

    const templateDoc = await db.collection('Slots').doc(templateSlotId).get();
    if(!templateDoc.exists){
        throw new Error('Recurring slot template not found. Please refresh and try again.');
    }

    const templateSlot = templateDoc.data();
    const doctorRef = db.collection('Doctors').doc(selectedDoctorId);

    const newSlotRef = db.collection('Slots').doc();
    await newSlotRef.set({
        DoctorID: doctorRef,
        doctorId: selectedDoctorId,
        date: selectedDateKey,
        RecurrStartDate: firebase.firestore.Timestamp.fromDate(new Date(`${selectedDateKey}T00:00:00`)),
        dayOfWeek: templateSlot.dayOfWeek,
        startTime: selectedTime,
        time: selectedTime,
        status: 'available',
        slotKey: slotKey,
        isRecurringGenerated: true,
        generatedFromTemplateId: templateSlotId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return newSlotRef.id;
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

        async function addDocsFromQuery(queryBuilder, label){
            try{
                const snapshot = await queryBuilder.get();
                console.log(label, 'returned', snapshot.size, 'documents');
                slotDocs = slotDocs.concat(snapshot.docs);
            } catch(err){
                console.warn(label, 'failed:', err);
            }
        }

        // Try common doctor-id field variants first; filter status/date in JS to avoid schema/index mismatch.
        await addDocsFromQuery(
            db.collection('Slots').where('DoctorID', '==', docId),
            'Slots query DoctorID(string)'
        );

        await addDocsFromQuery(
            db.collection('Slots').where('DoctorID', '==', doctorRef),
            'Slots query DoctorID(reference)'
        );

        await addDocsFromQuery(
            db.collection('Slots').where('doctorId', '==', docId),
            'Slots query doctorId(string)'
        );

        await addDocsFromQuery(
            db.collection('Slots').where('doctorId', '==', doctorRef),
            'Slots query doctorId(reference)'
        );

        // Last fallback: if no docs found, fetch recent slots and filter locally for mixed legacy data.
        if(slotDocs.length === 0){
            await addDocsFromQuery(
                db.collection('Slots').limit(300),
                'Slots broad fallback query'
            );
        }

        availableSlotsByDate = {};
        availableSlotsByMonth = {};
        const seenSlotIds = new Set();
        let skippedNotDoctor = 0;
        let skippedMissingFields = 0;
        let skippedPastDate = 0;
        let skippedStatus = 0;
        let addedCount = 0;

        slotDocs.forEach(doc => {
            if(seenSlotIds.has(doc.id)){
                return;
            }
            seenSlotIds.add(doc.id);

            const slot = doc.data();
            const dateValue = toDateKey(slot.date || slot.RecurrStartDate);
            const timeValue = slot.time || slot.startTime;
            const statusValue = String(slot.status || '').toLowerCase();
            const slotDoctorIdValue = slot.doctorId || slot.DoctorID;
            console.log('Slot raw data:', {
                id: doc.id,
                slot,
                dateValue,
                timeValue,
                statusValue,
                slotDoctorIdValue,
                currentDoctorId: docId
            });

            const matchesDoctor =
                slotDoctorIdValue === docId ||
                (slotDoctorIdValue && typeof slotDoctorIdValue === 'object' && slotDoctorIdValue.id === docId);

            if(!matchesDoctor){
                console.log('Slot skipped: doctor mismatch', { id: doc.id, slotDoctorIdValue, currentDoctorId: docId });
                skippedNotDoctor += 1;
                return;
            }

            if(!dateValue || !timeValue){
                console.log('Slot skipped: missing date/time', { id: doc.id, dateValue, timeValue });
                skippedMissingFields += 1;
                return;
            }

            if(dateValue < todayStr){
                console.log('Slot skipped: past date', { id: doc.id, dateValue, todayStr });
                skippedPastDate += 1;
                return;
            }

            if(statusValue && statusValue !== 'available'){
                console.log('Slot skipped: status not available', { id: doc.id, statusValue });
                skippedStatus += 1;
                return;
            }

            if(isRecurringTemplateSlot(slot)){
                const targetDayIndex = toDayIndex(slot.dayOfWeek);
                const templateStartDateKey = toDateKey(slot.RecurrStartDate || slot.date);

                if(targetDayIndex === null || !templateStartDateKey || !timeValue){
                    console.log('Recurring template skipped: invalid recurrence fields', {
                        id: doc.id,
                        targetDayIndex,
                        templateStartDateKey,
                        timeValue
                    });
                    skippedMissingFields += 1;
                    return;
                }

                const recurrenceAnchor = templateStartDateKey > todayStr ? templateStartDateKey : todayStr;
                let recurringDate = firstMatchingDateOnOrAfterDateKey(recurrenceAnchor, targetDayIndex);

                for(let weekIndex = 0; weekIndex < RECURRING_PREVIEW_WEEKS; weekIndex++){
                    const generatedDateKey = formatDateKeyFromDate(recurringDate);
                    const monthKey = toMonthKey(generatedDateKey);

                    if(monthKey){
                        if(!availableSlotsByMonth[monthKey]){
                            availableSlotsByMonth[monthKey] = [];
                        }
                        if(!availableSlotsByMonth[monthKey].includes(generatedDateKey)){
                            availableSlotsByMonth[monthKey].push(generatedDateKey);
                        }
                    }

                    if(!availableSlotsByDate[generatedDateKey]){
                        availableSlotsByDate[generatedDateKey] = [];
                    }

                    availableSlotsByDate[generatedDateKey].push({
                        id: `recurring_template_${doc.id}_${generatedDateKey}_${timeValue}`,
                        time: timeValue,
                        isRecurringTemplate: true,
                        templateSlotId: doc.id,
                        generatedDateKey: generatedDateKey
                    });

                    recurringDate.setDate(recurringDate.getDate() + 7);
                    addedCount += 1;
                }

                console.log('Recurring template expanded:', { id: doc.id, weeks: RECURRING_PREVIEW_WEEKS });
                return;
            }

            // Only group into month after all checks pass
            const monthKey = toMonthKey(dateValue);
            console.log('Slot accepted:', { id: doc.id, monthKey, dateValue, timeValue });
            if(monthKey){
                if(!availableSlotsByMonth[monthKey]){
                    availableSlotsByMonth[monthKey] = [];
                }
                if(!availableSlotsByMonth[monthKey].includes(dateValue)){
                    availableSlotsByMonth[monthKey].push(dateValue);
                }
            }

            if(!availableSlotsByDate[dateValue]){
                availableSlotsByDate[dateValue] = [];
            }

            availableSlotsByDate[dateValue].push({ id: doc.id, time: timeValue });
            addedCount += 1;
        });

        console.log('Slots normalization summary:', {
            totalQueriedDocs: slotDocs.length,
            addedCount,
            skippedNotDoctor,
            skippedMissingFields,
            skippedPastDate,
            skippedStatus,
            availableSlotsByMonth,
            availableSlotsByDate
        });

        // Ensure form container is visible before rendering dropdowns
        const formContainer = document.getElementById('appointment-form-container');
        if(formContainer) formContainer.style.display = 'block';

        // Keep times ordered for each date
        Object.keys(availableSlotsByDate).forEach(dateKey => {
            availableSlotsByDate[dateKey].sort((a, b) => a.time.localeCompare(b.time));
        });

        // Render month dropdown, then auto-select first available month
        renderMonthOptions();
        const firstMonthKeys = Object.keys(availableSlotsByMonth).sort();
        const monthSelectEl = document.getElementById('appointment-month');
        if(firstMonthKeys.length > 0 && monthSelectEl){
            monthSelectEl.value = firstMonthKeys[0];
            renderDateOptionsForMonth(firstMonthKeys[0]);
        }
    } catch(error){
        console.error('Error loading available slots:', error);
    }
}

// load times when date is selected
document.getElementById('appointment-date').addEventListener('change', function() {
    const selectedDate = this.value;
    renderTimeOptionsForDate(selectedDate, false);
});

// month listener — wrapped in null guard since form may not exist on all pages
const appointmentMonthSelect = ensureMonthSelectExists();
if(appointmentMonthSelect){
    appointmentMonthSelect.addEventListener('change', function() {
        const selectedMonth = this.value;
        renderDateOptionsForMonth(selectedMonth);
    });
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
    const recurringTemplateId = selectedTimeOption ? selectedTimeOption.getAttribute('data-recurring-template-id') : null;
    const generatedDate = selectedTimeOption ? selectedTimeOption.getAttribute('data-generated-date') : null;
    let slotId = selectedTimeOption ? selectedTimeOption.getAttribute('data-slot-id') : null;

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
        if(recurringTemplateId){
            slotId = await ensureConcreteSlotForRecurringTemplate(
                recurringTemplateId,
                generatedDate || appointmentDateValue,
                appointmentTime,
                doctorId
            );
        }

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
            doctorId: doctorId,
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
