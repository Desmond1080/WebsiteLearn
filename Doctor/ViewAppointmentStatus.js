const appointmentOverallStatusContainer = document.getElementById('appointment-overall-status-container');
const appointmentOverallStatusContent = document.getElementById('appointment-overall-status-content');
const doctorName = document.getElementById('doctor-name');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const doctorLogoutButton = document.getElementById('doctor-logout-button');

// check docotor id for the current user
async function getDoctorIdForUser(userId) {
    const byStringSnapshot = await db.collection('Doctors').where('userId', '==', userId).limit(1).get();
    if (!byStringSnapshot.empty) {
        return byStringSnapshot.docs[0].id;
    }

    const userRef = db.collection('Users').doc(userId);
    const byRefSnapshot = await db.collection('Doctors').where('userId', '==', userRef).limit(1).get();
    if (!byRefSnapshot.empty) {
        return byRefSnapshot.docs[0].id;
    }
    return null;
}

// check auth state
async function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if(!user){
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userDoc = await db.collection('Users').doc(user.uid).get();
        if(!userDoc.exists){
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userData = userDoc.data();
        if(userData?.role !== 'doctor'){
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        const doctorId = await getDoctorIdForUser(user.uid);
        if(!doctorId){
            const target = appointmentOverallStatusContent || appointmentOverallStatusContainer;
            if(target){
                target.innerHTML = '<p>Doctor profile not found. Please contact admin.</p>';
            }
            return;
        }

        if(doctorName){
            doctorName.textContent = `Dr. ${userData.name || 'Unknown'}`;
        }

        await loadAppointmentStatus(doctorId);
    });
}

checkAuthState();

// load different appointment status for the doctor
async function loadAppointmentStatus(doctorId) {
    const target = appointmentOverallStatusContent || appointmentOverallStatusContainer;
    if (!target) return;

    target.innerHTML = '';

    try{
        const appointmentsSnapshot = await db.collection('Appointments').where('doctorId', '==', doctorId).get();
        if(appointmentsSnapshot.empty){
            target.innerHTML = '<p>No appointments found.</p>';
            return;
        }
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            const data = doc.data();
            appointments.push({
                id: doc.id,
                patientName: data.patientName || 'Unknown Patient',
                date: `${data.appointmentDate || 'Unknown date'} ${data.appointmentTime || ''}`.trim(),
                status: data.status || 'Pending'
            });
        });

        // group appointments by status
        const grouped = appointments.reduce((acc, appointment) => {
            if (!acc[appointment.status]) {
                acc[appointment.status] = [];
            }
            acc[appointment.status].push(appointment);
            return acc;
        }, {});

        // render each status group
        for (const status in grouped) {
            const groupContainer = document.createElement('div');
            groupContainer.classList.add('appointment-status-section');
            const groupTitle = document.createElement('h2');
            groupTitle.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            groupContainer.appendChild(groupTitle);
            const list = document.createElement('ul');
            grouped[status].forEach(appointment => {
                const listItem = document.createElement('li');
                listItem.textContent = `${appointment.patientName} - ${appointment.date}`;
                list.appendChild(listItem);
            });
            groupContainer.appendChild(list);
            target.appendChild(groupContainer);

        }


    } catch(error){
        console.error("Error loading appointment status: ", error);
        target.innerHTML = '<p>Error loading appointments. Please try again later.</p>';
    }
}


function showLogoutConfirmation(){
    console.log('showLogoutConfirmation called');
    console.log('logoutPopup element:', logoutPopup);
    if(logoutPopup){
        console.log('Adding visible class');
        logoutPopup.classList.add('visible');
        document.body.style.overflow = 'hidden';
    } else {
        console.log('logoutPopup is null!');
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

// Attach event listener to logout button
if(doctorLogoutButton){
    console.log('Adding click listener to logout button');
    doctorLogoutButton.addEventListener('click', (event) => {
        console.log('Logout button clicked!');
        event.preventDefault();
        showLogoutConfirmation();
    });
} else {
    console.log('doctorLogoutButton not found!');
}