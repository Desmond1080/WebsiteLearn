const totalDoctors = document.getElementById('doctor-list-content');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const editDoctorNameInput = document.getElementById('edit-doctor-name');
const editDoctorUsernameInput = document.getElementById('edit-doctor-username');
const editDoctorSpecializationInput = document.getElementById('edit-doctor-specialization');
const editDoctorGenderInput = document.getElementById('edit-doctor-gender');
const editDoctorEmailInput = document.getElementById('edit-doctor-email');
const addDoctorGenderSelect = document.getElementById('add-doctor-gender');

// appointment state
const bookAppointmentPopup = document.getElementById('book-appointment-popup');
const appointmentDoctorId = document.getElementById('appointment-doctor-id');
const appointmentDoctorNameEl = document.getElementById('appointment-doctor-name');
const appointmentDoctorRoomInput = document.getElementById('appointment-doctor-room');
const appointmentDateInput = document.getElementById('appointment-date');
const appointmentTimeInput = document.getElementById('appointment-time');
const appointmentPatientNameInput = document.getElementById('appointment-name');
const appointmentReasonInput = document.getElementById('appointment-reason');

// manage slots state
const manageSlotsPopup = document.getElementById('manage-slots-popup');
const slotsDoctorIdInput = document.getElementById('slots-doctor-id');
const slotsDoctorNameInput = document.getElementById('slots-doctor-name');
const slotsRecurrDateInput = document.getElementById('slots-recurr-date');
const slotsDayOfWeekInput = document.getElementById('slots-day-of-week');
const slotsStartTimeInput = document.getElementById('slots-start-time');
const slotsWeeksAheadInput = document.getElementById('slots-weeks-ahead');

let currentManageSlotsDoctorId = null;
let currentManageSlotsDoctorData = null;
let currentBookingDoctorId = null;
let currentBookingDoctorData = null;
let currentEditDoctorId = null;
let currentEditUserId = null;
let isDoctorUpdateInProgress = false;
let lastDoctorUpdateAttemptAt = 0;
const DOCTOR_UPDATE_COOLDOWN_MS = 1200;


//check auth state
async function checkAuthState(){
    auth.onAuthStateChanged(async (user) => {
        if(!user){
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        if(adminNameEl){
            adminNameEl.textContent = user.displayName || user.email;
        }
    });
    loadDoctors();
    loadPatientsForAppointment();
}


// load doctors from firestore and display as table 
async function loadDoctors(){
    try{
        console.log('Doctors: loading doctor data...');
        const doctorsSnapshot = await db.collection('Doctors').get();
        const doctorsProfileSnapshot = await db.collection('Users').where('role', '==', 'doctor').get();
        console.log('Doctors: Doctors collection count', doctorsSnapshot.size);
        console.log('Doctors: Users role=doctor count', doctorsProfileSnapshot.size);
        
        if(doctorsSnapshot.empty){
            console.log('Doctors: Doctors collection is empty');
            return;
        }
        if(doctorsProfileSnapshot.empty){
            console.log('Doctors: No users with role=doctor found');
            return;
        }
        
        console.log('Doctors: First 3 Users doc IDs:', doctorsProfileSnapshot.docs.map(d => d.id).slice(0, 3));
        console.log('Doctors: First 3 Doctors userId values:', doctorsSnapshot.docs.map(d => d.data().userId).slice(0, 3));
        console.log('Doctors: First doctor doc sample:', doctorsSnapshot.docs[0]?.data());
        console.log('Doctors: First user doc sample:', doctorsProfileSnapshot.docs[0]?.data());
        
        let doctorListHTML = `<table>
            <thead>
                <tr>
                    <th>Doctor Name</th>
                    <th>Username</th>
                    <th>Specialization</th>
                    <th>Gender</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        if(!doctorsSnapshot.empty && !doctorsProfileSnapshot.empty){
            const doctorProfiles = {};
            doctorsProfileSnapshot.docs.forEach(element => {
                const doctorProfileData = element.data();
                doctorProfiles[element.id] = doctorProfileData;
            });
            
            // Create fallback join by email
            const doctorProfilesByEmail = {};
            doctorsProfileSnapshot.docs.forEach(element => {
                const doctorProfileData = element.data();
                if(doctorProfileData.email){
                    doctorProfilesByEmail[doctorProfileData.email.toLowerCase()] = doctorProfileData;
                }
            });

            doctorsSnapshot.forEach((doc) => {
                const doctorData = doc.data();
                
                // Get userId - handle both string and reference types
                const userId = typeof doctorData.userId === 'string' 
                    ? doctorData.userId 
                    : doctorData.userId?.id;
                
                console.log('Doctors: Processing userId type:', typeof doctorData.userId, 'extracted:', userId);
                
                // Join by userId (matches Users doc ID)
                let doctorProfile = doctorProfiles[userId];
                
                if(doctorProfile){
                    console.log('Doctors: Found matching profile for userId', userId);
                } else {
                    console.log('Doctors: No match for userId', userId, '- trying email fallback');
                }
                
                // Fallback to join by email
                if(!doctorProfile && doctorData.email){
                    doctorProfile = doctorProfilesByEmail[doctorData.email.toLowerCase()];
                    if(doctorProfile){
                        console.log('Doctors: Used email fallback for', doctorData.email);
                    }
                }

                doctorProfile = doctorProfile || {};
                const genderLabel = doctorProfile.gender || doctorData.gender || 'N/A';
                doctorListHTML += `<tr>
                    <td>${doctorData.name || 'N/A'}</td>
                    <td>${doctorProfile.username || 'N/A'}</td>
                    <td>${doctorData.specialization || 'N/A'}</td>
                    <td>${genderLabel}</td>
                    <td>${doctorProfile.email || 'N/A'}</td>
                    <td style="text-align: center;">
                        <button type="button" class="edit-btn" onclick="showEditDoctorForm('${doc.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button" class="book-btn" onclick="showBookAppointmentForm('${doc.id}')">
                            <i class="fas fa-calendar-plus"></i> Book
                        </button>
                        <button type="button" class="manage-slots-btn" onclick="showManageSlotsForm('${doc.id}')">
                            <i class="fas fa-clock"></i> Manage Slots
                        </button>
                    </td>
                </tr>`;
            });
            doctorListHTML += '</tbody></table>';
            console.log('Doctors: final HTML length', doctorListHTML.length);
            console.log('Doctors: HTML preview:', doctorListHTML.substring(0, 200));
            console.log('Doctors: totalDoctors element exists?', !!totalDoctors);
            if(totalDoctors){
                totalDoctors.innerHTML = doctorListHTML;
                console.log('Doctors: HTML rendered to page');
                console.log('Doctors: element innerHTML after render:', totalDoctors.innerHTML.substring(0, 100));
            } else {
                console.log('Doctors: ERROR - totalDoctors element not found');
            }
        } else {
            console.log('Doctors: no matching data to display.');
            doctorListHTML += '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #64748b;">No doctors found</td></tr></tbody></table>';
            if(totalDoctors){
                totalDoctors.innerHTML = doctorListHTML;
            }
        }
    }catch(error){
        console.error('Error loading doctors:', error);
    }
}

checkAuthState();

//show manage slots form with doctor details 
async function showManageSlotsForm(doctorId){
    const adminMain = document.getElementById('admin-main');

    if(!doctorId){
        alert('Doctor ID is missing for slot management.');
        return;
    }

    currentManageSlotsDoctorId = doctorId;

    try{
        const doctorDoc = await db.collection('Doctors').doc(doctorId).get();
        if(!doctorDoc.exists){
            alert('Doctor not found.');
            return;
        }

        currentManageSlotsDoctorData = doctorDoc.data();

        if(slotsDoctorIdInput) slotsDoctorIdInput.value = doctorId;
        if(slotsDoctorNameInput) slotsDoctorNameInput.value = currentManageSlotsDoctorData.name || 'N/A';
        if(slotsRecurrDateInput){
            const today = new Date().toISOString().split('T')[0];
            slotsRecurrDateInput.min = today;
            slotsRecurrDateInput.value = today;
        }
        if(slotsDayOfWeekInput) slotsDayOfWeekInput.value = '';
        if(slotsStartTimeInput) slotsStartTimeInput.value = '';
        if(slotsWeeksAheadInput) slotsWeeksAheadInput.value = '12';
    } catch(error){
        console.error('Error preparing manage slots form:', error);
        alert('Unable to open manage slots form.');
        return;
    }

    if(manageSlotsPopup){
        manageSlotsPopup.style.display = 'flex';
    }

    if(adminMain){
        adminMain.style.filter = 'blur(5px)';
    }

    document.body.style.overflow = 'hidden';
}

// close manage slots pop up 
function closeManageSlotsPopup(){
    const adminMain = document.getElementById('admin-main');

    if(manageSlotsPopup){
        manageSlotsPopup.style.display = 'none';
    }

    if(adminMain){
        adminMain.style.filter = 'none';
    }

    document.body.style.overflow = 'auto';

    if(slotsDoctorIdInput) slotsDoctorIdInput.value = '';
    if(slotsDoctorNameInput) slotsDoctorNameInput.value = '';
    if(slotsRecurrDateInput) slotsRecurrDateInput.value = '';
    if(slotsDayOfWeekInput) slotsDayOfWeekInput.value = '';
    if(slotsStartTimeInput) slotsStartTimeInput.value = '';
    if(slotsWeeksAheadInput) slotsWeeksAheadInput.value = '12';

    currentManageSlotsDoctorId = null;
    currentManageSlotsDoctorData = null;
}

//show book appointment form with doctor details
async function showBookAppointmentForm(doctorId){
    currentBookingDoctorId = doctorId;

    const adminMain = document.getElementById('admin-main');

    if(bookAppointmentPopup){
        bookAppointmentPopup.style.display = 'flex';
    }

    if(adminMain){
        adminMain.style.filter = 'blur(5px)';
    }
    document.body.style.overflow = 'hidden';

    await loadPatientsForAppointment();
    await loadDoctorDetailsForAppointment(doctorId);
}

function dayNameToIndex(dayName){
    const dayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };
    return dayMap[dayName];
}

function formatDateKey(dateObj){
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function firstMatchingDateOnOrAfter(startDate, targetDayIndex){
    const date = new Date(startDate);
    const diff = (targetDayIndex - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
}

// Generate weekly recurring slots from a recurrence rule.
async function saveRecurringSlots(){
    const doctorId = slotsDoctorIdInput ? slotsDoctorIdInput.value : currentManageSlotsDoctorId;
    const dayOfWeek = slotsDayOfWeekInput ? slotsDayOfWeekInput.value : '';
    const recurrStartDate = slotsRecurrDateInput ? slotsRecurrDateInput.value : '';
    const startTime = slotsStartTimeInput ? slotsStartTimeInput.value : '';
    const weeksAhead = slotsWeeksAheadInput ? parseInt(slotsWeeksAheadInput.value, 10) : 12;

    if(!doctorId || !dayOfWeek || !recurrStartDate || !startTime || !weeksAhead){
        alert('Please complete all recurring slot fields.');
        return;
    }

    const targetDayIndex = dayNameToIndex(dayOfWeek);
    if(targetDayIndex === undefined){
        alert('Invalid day of week selected.');
        return;
    }

    const doctorRef = db.collection('Doctors').doc(doctorId);
    const startDateObj = new Date(`${recurrStartDate}T00:00:00`);
    let currentDate = firstMatchingDateOnOrAfter(startDateObj, targetDayIndex);

    let createdCount = 0;
    let skippedCount = 0;

    try{
        for(let i = 0; i < weeksAhead; i++){
            const dateKey = formatDateKey(currentDate);
            const slotKey = `${doctorId}_${dateKey}_${startTime}`;

            const existingSlot = await db.collection('Slots')
                .where('slotKey', '==', slotKey)
                .limit(1)
                .get();

            if(!existingSlot.empty){
                skippedCount += 1;
                currentDate.setDate(currentDate.getDate() + 7);
                continue;
            }

            await db.collection('Slots').add({
                DoctorID: doctorRef,
                doctorId: doctorId,
                date: dateKey,
                RecurrStartDate: firebase.firestore.Timestamp.fromDate(new Date(`${dateKey}T00:00:00`)),
                dayOfWeek: dayOfWeek,
                startTime: startTime,
                time: startTime,
                status: 'available',
                slotKey: slotKey,
                isRecurringGenerated: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            createdCount += 1;
            currentDate.setDate(currentDate.getDate() + 7);
        }

        alert(`Recurring slots saved. Created: ${createdCount}, Skipped duplicates: ${skippedCount}`);
        closeManageSlotsPopup();
    } catch(error){
        console.error('Error saving recurring slots:', error);
        alert('Failed to save recurring slots: ' + error.message);
    }
}

// load patients for appointment booking dropdown
async function loadPatientsForAppointment(){
    if(!appointmentPatientNameInput){
        console.error('Appointment patient name input not found');
        return;
    }

    const patients = document.getElementById('appointment-name');
    try{
        const patientsSnapshot = await db.collection('Users').where('role', '==' , 'user').get();
        if(patientsSnapshot.empty){
            console.log('No patients found for appointment booking');
            return;
        }

        patients.innerHTML = '<option value="">Select Patient</option>';
        patientsSnapshot.forEach((doc) => {
            const patientData = doc.data();
            const option = document.createElement('option');
            // Store user ID as the value so we can retrieve it later for booking
            option.value = doc.id;
            // Display the patient's name
            option.textContent = patientData.name || 'Unnamed Patient';
            // Store user ID as data attribute for easy access
            option.setAttribute('data-patient-id', doc.id);
            option.setAttribute('data-patient-email', patientData.email || '');
            patients.appendChild(option);
        });
    } catch(error){
        console.error('Error loading patients for appointment:', error);
    }
}

//load doctor details for appointment booking form
async function loadDoctorDetailsForAppointment(doctorId){
    if(!doctorId){
        console.error('No doctor ID provided for appointment form');
        return;
    }

    try{
        const doctorDoc = await db.collection('Doctors').doc(doctorId).get();

        if(!doctorDoc.exists){
            console.error('Doctor not found for appointment booking:', doctorId);
            return;
        }

        const doctorData = doctorDoc.data();
        currentBookingDoctorData = doctorData;

        if(appointmentDoctorNameEl){
            appointmentDoctorNameEl.value = doctorData.name || 'N/A';
        }

        if(appointmentDoctorRoomInput){
            appointmentDoctorRoomInput.value = doctorData.roomNumber || doctorData.room || 'N/A';
        }

        if(appointmentDoctorId){
            appointmentDoctorId.value = doctorId;
        }
    } catch(error){
        console.error('Error loading doctor details for appointment:', error);
    }
}

//close book appointment pop up
function closeBookAppointmentPopup(){
    const adminMain = document.getElementById('admin-main');

    if(bookAppointmentPopup){
        bookAppointmentPopup.style.display = 'none';
    }

    if(adminMain){
        adminMain.style.filter = 'none';
    }

    document.body.style.overflow = 'auto';

    if(appointmentPatientNameInput){
        appointmentPatientNameInput.selectedIndex = 0;
    }

    if(appointmentDoctorNameEl){
        appointmentDoctorNameEl.value = '';
    }

    if(appointmentDoctorRoomInput){
        appointmentDoctorRoomInput.value = '';
    }

    if(appointmentDateInput){
        appointmentDateInput.value = '';
    }

    if(appointmentTimeInput){
        appointmentTimeInput.value = '';
    }

    if(appointmentReasonInput){
        appointmentReasonInput.value = '';
    }

    currentBookingDoctorData = null;
    currentBookingDoctorId = null;
}

// book and save appointment info to firebase 
async function bookAppointmentForDoctor(){
    const patientSelectElement = document.getElementById('appointment-name');
    const selectedOption = patientSelectElement.options[patientSelectElement.selectedIndex];
    
    // Get user ID from selected option value
    const patientId = selectedOption.value;
    const patientEmail = selectedOption.getAttribute('data-patient-email');
    const patientName = selectedOption.textContent;
    
    const appointmentDate = appointmentDateInput.value;
    const appointmentTime = appointmentTimeInput.value;
    const appointmentReason = appointmentReasonInput ? appointmentReasonInput.value : '';

    // Validate all fields
    if(!patientId || !appointmentDate || !appointmentTime || !appointmentReason){
        alert('Please fill in all appointment details');
        return;
    }

    const appointmentData = {
        userId: patientId,
        patientName: patientName,
        patientEmail: patientEmail,
        doctorId: currentBookingDoctorId,
        doctorName: currentBookingDoctorData.name || '',
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        reason: appointmentReason,
        status: 'booked',
        bookedByRole: 'admin',
        bookedByAdminId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const notificationData = {
        userId: patientId,
        title: 'Appointment Booked Successfully',
        message: "Your appointment with Dr. " + (currentBookingDoctorData.name || 'N/A') + " on " + appointmentDate + " at " + appointmentTime + " has been booked successfully.",
        isRead: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }

    try{
        await db.collection('Appointments').add(appointmentData);

        await db.collection('Notifications').add(notificationData);

        alert('Appointment booked successfully!');
        closeBookAppointmentPopup();
    } catch(error){
        console.error('Error booking appointment:', error);
        alert('Error booking appointment: ' + error.message);
    }
}

//show edit form with doctor details
async function showEditDoctorForm(doctorId){
    const adminMain = document.getElementById('admin-main');
    const editDoctorPopup = document.getElementById('edit-doctor-popup');
    const updateButton = document.querySelector('.edit-doctor-content .update-btn');
    
    // Clear form fields first
    if(editDoctorNameInput) editDoctorNameInput.value = '';
    if(editDoctorUsernameInput) editDoctorUsernameInput.value = '';
    if(editDoctorSpecializationInput) editDoctorSpecializationInput.value = '';
    if(editDoctorGenderInput) editDoctorGenderInput.value = '';
    if(editDoctorEmailInput) editDoctorEmailInput.value = '';
    
    // Disable update button until data loads
    if(updateButton){
        updateButton.disabled = true;
        updateButton.textContent = 'Loading...';
    }
    
    if(editDoctorPopup){
        editDoctorPopup.style.display = 'flex';
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }
        document.body.style.overflow = 'hidden';
    }

    if(doctorId){
        currentEditDoctorId = doctorId;
        // Wait for data to load before enabling the button
        editDoctorDetails(doctorId).then(() => {
            if(updateButton){
                updateButton.disabled = false;
                updateButton.textContent = 'Update';
            }
        }).catch((error) => {
            console.error('Error loading doctor details:', error);
            if(updateButton){
                updateButton.disabled = false;
                updateButton.textContent = 'Update';
            }
        });
    }

}

function closeEditDoctorPopup(){
    const adminMain = document.getElementById('admin-main');
    const editDoctorPopup = document.getElementById('edit-doctor-popup');
    if(editDoctorPopup){
        editDoctorPopup.style.display = 'none';
    }
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
}

function showUpdateSuccessMessage(){
    const updateSuccessMessage = document.getElementById('update-success-message');
    if(updateSuccessMessage){
        updateSuccessMessage.style.display = 'flex';
        const adminMain = document.getElementById('admin-main');
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }  
        document.body.style.overflow = 'hidden';
    }
    
}

function closeUpdateSuccessMessage(){
    const updateSuccessMessage = document.getElementById('update-success-message');
    if(updateSuccessMessage){
        updateSuccessMessage.style.display = 'none';
    }
    const adminMain = document.getElementById('admin-main');
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
}

//update doctor details from edit form
async function updateProfile(){
    console.log('=== updateProfile() CALLED ===');
    const updateButton = document.querySelector('.edit-doctor-content .update-btn');

    if(isDoctorUpdateInProgress){
        console.log('Update blocked: request already in progress');
        return;
    }

    const now = Date.now();
    if(now - lastDoctorUpdateAttemptAt < DOCTOR_UPDATE_COOLDOWN_MS){
        console.log('Update blocked: cooldown active');
        return;
    }

    isDoctorUpdateInProgress = true;
    lastDoctorUpdateAttemptAt = now;
    if(updateButton){
        updateButton.disabled = true;
        updateButton.textContent = 'Updating...';
    }
    
    try{
        console.log('1. Checking currentEditDoctorId:', currentEditDoctorId);
        if(!currentEditDoctorId){
            alert('Error: No doctor selected for update.');
            return;
        }

        // Validate inputs exist
        console.log('2. Checking form field elements...');
        if(!editDoctorNameInput || !editDoctorUsernameInput || !editDoctorSpecializationInput){
            alert('Error: Form fields not found');
            console.error('Missing form inputs:', {editDoctorNameInput, editDoctorUsernameInput, editDoctorSpecializationInput});
            return;
        }
        console.log('3. Form fields found ✓');

        const nameValue = editDoctorNameInput.value.trim();
        const usernameValue = editDoctorUsernameInput.value.trim();
        const specializationValue = editDoctorSpecializationInput.value.trim();
        const genderValue = editDoctorGenderInput.value;
        const emailValue = editDoctorEmailInput.value.trim();
        
        console.log('4. Form values:', {
            name: nameValue,
            nameLength: nameValue.length,
            username: usernameValue,
            usernameLength: usernameValue.length,
            specialization: specializationValue,
            specializationLength: specializationValue.length
        });

        // doctor name validation
        console.log('5. Validating doctor name...');
        if(!nameValue || nameValue.length === 0){
            alert('Doctor name cannot be empty.');
            editDoctorNameInput.focus();
            return;
        }
        
        if(nameValue.length < 3){
            alert('Doctor name must be at least 3 characters long.');
            editDoctorNameInput.focus();
            return;
        }

        if(nameValue.length > 150){
            alert('Doctor name must be less than 150 characters long.');
            editDoctorNameInput.focus();
            return;
        }
        console.log('6. Doctor name validation passed ✓');

        // username validation
        console.log('7. Validating username...');
        if(!usernameValue || usernameValue.length === 0){
            alert('Username cannot be empty.');
            editDoctorUsernameInput.focus();
            return;
        }
        
        if(usernameValue.length < 3){
            alert('Username must be at least 3 characters long.');
            editDoctorUsernameInput.focus();
            return;
        }

        if(usernameValue.length > 150){
            alert('Username must be less than 150 characters long.');
            editDoctorUsernameInput.focus();
            return;
        }
        console.log('8. Username validation passed ✓');

        // specialization validation
        console.log('9. Validating specialization...');
        if(!specializationValue || specializationValue.length === 0){
            alert('Specialization cannot be empty.');
            editDoctorSpecializationInput.focus();
            return;
        }
        
        if(specializationValue.length < 2){
            alert('Specialization must be at least 2 characters long.');
            editDoctorSpecializationInput.focus();
            return;
        }
        console.log('10. Specialization validation passed ✓');

        // gender validation
        console.log('10.5. Validating gender...');
        if(!genderValue || genderValue.length === 0){
            alert('Gender must be selected.');
            editDoctorGenderInput.focus();
            return;
        }
        console.log('10.6. Gender validation passed ✓');

        // email validation
        console.log('10.7. Validating email...');
        if(!emailValue || emailValue.length === 0){
            alert('Email cannot be empty.');
            return;
        }
        console.log('10.8. Email validation passed ✓');

        console.log('✓ ALL VALIDATIONS PASSED');
        console.log('11. Updating doctor with ID:', currentEditDoctorId);
        
        const doctorDocRef = db.collection('Doctors').doc(currentEditDoctorId);
        const doctorDoc = await doctorDocRef.get();
        if(!doctorDoc.exists){
            console.error('Doctor doc not found for update:', currentEditDoctorId);
            alert('Error: Doctor not found in database');
            return;
        }
        const doctorData = doctorDoc.data();
        const userId = typeof doctorData.userId === 'string'
            ? doctorData.userId
            : doctorData.userId?.id;
        if(!userId){
            console.error('Doctor userId missing or invalid for update:', currentEditDoctorId);
            alert('Error: Doctor user ID is missing');
            return;
        }
        const doctorProfileDocRef = db.collection('Users').doc(userId);
        const doctorProfileDoc = await doctorProfileDocRef.get();
        if(!doctorProfileDoc.exists){
            console.error('Doctor profile doc not found for update:', userId);
            alert('Error: Doctor profile not found');
            return;
        }

        const updatedDoctorData = {
            name: nameValue,
            specialization: specializationValue,
        };
        const updatedDoctorProfileData = {
            username: usernameValue,
            gender: editDoctorGenderInput.value,
            email: editDoctorEmailInput.value,
        };
        
        console.log('Updating Doctors collection with:', updatedDoctorData);
        console.log('Updating Users collection with:', updatedDoctorProfileData);
        
        await doctorDocRef.update(updatedDoctorData);
        console.log('✓ Doctors collection updated successfully');
        
        await doctorProfileDocRef.update(updatedDoctorProfileData);
        console.log('✓ Users collection updated successfully');
        
        closeEditDoctorPopup();
        showUpdateSuccessMessage();
        
        // Reload the doctor list after a short delay
        setTimeout(() => {
            console.log('Reloading doctor list...');
            loadDoctors();
        }, 500);
    }
    catch(error){
        console.error('ERROR in updateProfile():', error);
        console.error('Error stack:', error.stack);
        alert('Error: ' + error.message);
    } finally {
        isDoctorUpdateInProgress = false;
        if(updateButton){
            updateButton.disabled = false;
            updateButton.textContent = 'Update';
        }
    }
}

//edit specific doctor details show in edit form like a pop up form 
async function editDoctorDetails(doctorId){
    try{
        const doctorDoc = await db.collection('Doctors').doc(doctorId).get();
        if(!doctorDoc.exists){
            console.error('Doctor doc not found for edit:', doctorId);
            return Promise.reject(new Error('Doctor not found'));
        }

        const doctorData = doctorDoc.data();
        const userId = typeof doctorData.userId === 'string'
            ? doctorData.userId
            : doctorData.userId?.id;

        if(!userId){
            console.error('Doctor userId missing or invalid for edit:', doctorId);
            return Promise.reject(new Error('Doctor user ID missing'));
        }

        const doctorProfileDoc = await db.collection('Users').doc(userId).get();

        if(doctorProfileDoc.exists){
            const doctorData = doctorDoc.data();
            const doctorProfileData = doctorProfileDoc.data();
            if(editDoctorNameInput){
                editDoctorNameInput.value = doctorData.name || '';
            }
            if(editDoctorUsernameInput){
                editDoctorUsernameInput.value = doctorProfileData.username || '';
            }
            if(editDoctorSpecializationInput){
                editDoctorSpecializationInput.value = doctorData.specialization || '';
            }
            if(editDoctorGenderInput){
                editDoctorGenderInput.value = doctorProfileData.gender || '';
            }
            if(editDoctorEmailInput){
                editDoctorEmailInput.value = doctorProfileData.email || '';
            }
            console.log('Doctor details loaded successfully');
            return Promise.resolve();
        } else {
            console.error('Doctor profile doc not found for edit:', userId);
            return Promise.reject(new Error('Doctor profile not found'));
        }
    }catch(error){
        console.error('Error fetching doctor details for edit:', error);
        return Promise.reject(error);
    }
}

//show add doctor pop up 
function showAddDoctorPopup(){
    const adminMain = document.getElementById('admin-main');
    const doctorPopup = document.getElementById('add-doctor-popup');

    if(doctorPopup){
        doctorPopup.style.display = 'flex';
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }
        document.body.style.overflow = 'hidden';
    }
}


// cancel add doctor pop up
function closeAddDoctorPopup(){
    const adminMain = document.getElementById('admin-main');
    const doctorPopup = document.getElementById('add-doctor-popup');

    if(doctorPopup){
        doctorPopup.style.display = 'none';
    }
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
}

//add new doctor
async function addNewDoctor(){
    try{
        const nameInput = document.getElementById('add-doctor-name');
        const usernameInput = document.getElementById('add-doctor-username');
        const specializationInput = document.getElementById('add-doctor-specialization');
        const genderInput = document.getElementById('add-doctor-gender');
        const descriptionInput = document.getElementById('add-doctor-description');
        const roomInput = document.getElementById('add-doctor-room');
        const phoneNumberInput = document.getElementById('add-doctor-phone');
        const emailInput = document.getElementById('add-doctor-email');
        const passwordInput = document.getElementById('add-doctor-password');

        const name = nameInput.value;
        const username = usernameInput.value;
        const specialization = specializationInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const gender = genderInput.value;
        const description = descriptionInput.value;
        const phoneNumber = phoneNumberInput.value;
        const room = roomInput.value;

        if(!auth.currentUser){
            throw new Error('No user logged in.');
        }

        console.log('Getting ID token for user:', auth.currentUser.uid);
        const idToken = await auth.currentUser.getIdToken();
        console.log('ID token obtained, length:', idToken.length);
        
        const response = await fetch('http://localhost:3000/api/admin/create-doctor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                name,
                username,
                specialization,
                description,
                room,
                gender,
                phoneNumber,
                email,
                password
            })
        });

        console.log('Response status:', response.status);
        
        // Check if response has content before parsing JSON
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let result;
        if(responseText){
            try{
                result = JSON.parse(responseText);
            }catch(e){
                throw new Error('Server returned invalid response: ' + responseText);
            }
        }else{
            throw new Error('Server returned empty response');
        }
        
        console.log('Server response:', result);
        
        if(!response.ok){
            throw new Error(result.error || 'Failed to create doctor');
        }
        
        console.log('Doctor created successfully');
        alert('Doctor added successfully!');
        closeAddDoctorPopup();
        loadDoctors();

    } catch(error){
        console.error('Error adding new doctor:', error);
        alert('Error: ' + error.message);
    }
}

function closeAddDoctorPopup(){
    const adminMain = document.getElementById('admin-main');
    const doctorPopup = document.getElementById('add-doctor-popup');

    if(doctorPopup){
        doctorPopup.style.display = 'none';
    }
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';

}

function showLogoutConfirmation(){
    if(logoutPopup){
        logoutPopup.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function cancelLogout(){
    if(logoutPopup){
        logoutPopup.classList.remove('visible');
        document.body.style.overflow = 'auto';
    }
}

async function confirmLogout(){
    try{
        await auth.signOut();
        localStorage.removeItem('userRole');
        window.location.href = '../User/UserLoginAndRegister.html';
    }catch(error){
        console.error('Logout error:', error);
    }
}

if(logoutButton){
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        showLogoutConfirmation();
    });
}

function setActiveNavLink(){
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.navbar-menu .nav-link').forEach((link) => {
        const href = link.getAttribute('href');
        if(!href){
            return;
        }
        const linkPage = new URL(href, window.location.origin).pathname.split('/').pop();
        if(linkPage === currentPage){
            link.classList.add('active');
        }
    });
}

function initAddDoctorGenderSelect(){
    if(!addDoctorGenderSelect){
        return;
    }

    const removePlaceholder = () => {
        const placeholder = addDoctorGenderSelect.querySelector('option[value=""]');
        if(placeholder){
            placeholder.remove();
        }
    };

    addDoctorGenderSelect.addEventListener('change', () => {
        if(addDoctorGenderSelect.value){
            removePlaceholder();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    initAddDoctorGenderSelect();
});