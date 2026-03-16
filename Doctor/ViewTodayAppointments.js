const todayAppointmentsContainer = document.getElementById('today-appointments-container');
const todayAppointmentsContent = document.getElementById('today-appointment-content');

function getTodayDateKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

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

function renderEmpty(message) {
    const target = todayAppointmentsContent || todayAppointmentsContainer;
    if (!target) return;
    target.innerHTML = `<p>${message}</p>`;
}

// check auth state
async function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userDoc = await db.collection('Users').doc(user.uid).get();
        if (!userDoc.exists) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userData = userDoc.data();
        if (userData?.role !== 'doctor') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const doctorId = await getDoctorIdForUser(user.uid);
        if (!doctorId) {
            renderEmpty('Doctor profile not found. Please contact admin.');
            return;
        }

        await loadTodayAppointments(doctorId);
    });
}

// load today's appointments
async function loadTodayAppointments(doctorId) {
    const todayKey = getTodayDateKey();
    const target = todayAppointmentsContent || todayAppointmentsContainer;
    if (!target) return;

    target.innerHTML = '';

    try {
        const appointmentSnapshot = await db
            .collection('Appointments')
            .where('doctorId', '==', doctorId)
            .where('appointmentDate', '==', todayKey)
            .get();

        if (appointmentSnapshot.empty) {
            renderEmpty('No appointments scheduled for today.');
            return;
        }

        const appointments = appointmentSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => String(a.appointmentTime || '').localeCompare(String(b.appointmentTime || '')));

        appointments.forEach((appointmentData) => {
            const appointmentElement = document.createElement('div');
            appointmentElement.classList.add('appointment');

            const patientName = appointmentData.patientName || 'Unknown Patient';
            const appointmentTime = appointmentData.appointmentTime || 'N/A';
            const reason = appointmentData.appointmentReason || appointmentData.reason || 'Not specified';
            const status = appointmentData.status || 'Pending';

            appointmentElement.innerHTML = `
                <h3>${patientName}</h3>
                <p><strong>Time:</strong> ${appointmentTime}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Status:</strong> ${status}</p>
            `;

            target.appendChild(appointmentElement);
        });
    } catch (error) {
        console.error('Error loading today appointments:', error);
        renderEmpty('Failed to load appointments. Please refresh and try again.');
    }
}

checkAuthState();