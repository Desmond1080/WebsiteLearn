const calendarContent = document.getElementById('appointment-calendar-content');
const monthLabel = document.getElementById('calendar-month-label');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const doctorLogoutButton = document.getElementById('doctor-logout-button');
const doctorName = document.getElementById('doctor-name');

let currentDoctorId = null;
let currentViewDate = new Date();
let appointmentsByDate = {};

function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isToday(dateObj) {
    return toDateKey(dateObj) === toDateKey(new Date());
}

function monthTitle(dateObj) {
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function normalizeStatusClass(status) {
    return String(status || '').toLowerCase();
}

function renderEmpty(message) {
    if (!calendarContent) return;
    calendarContent.innerHTML = `<div class="empty-note">${message}</div>`;
}

async function getDoctorIdForUser(userId) {
    const byStringSnapshot = await db.collection('Doctors').where('userId', '==', userId).limit(1).get();
    if (!byStringSnapshot.empty) return byStringSnapshot.docs[0].id;

    const userRef = db.collection('Users').doc(userId);
    const byRefSnapshot = await db.collection('Doctors').where('userId', '==', userRef).limit(1).get();
    if (!byRefSnapshot.empty) return byRefSnapshot.docs[0].id;

    return null;
}

function renderCalendarGrid() {
    if (!calendarContent) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = '<div class="calendar-weekdays">';
    weekdays.forEach((day) => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    html += '</div><div class="calendar-grid">';

    for (let i = 0; i < startWeekDay; i++) {
        html += '<div class="calendar-day muted"></div>';
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateObj = new Date(year, month, day);
        const dateKey = toDateKey(dateObj);
        const dayAppointments = appointmentsByDate[dateKey] || [];
        const todayClass = isToday(dateObj) ? ' today' : '';

        html += `<div class="calendar-day${todayClass}">`;
        html += `<div class="day-number">${day}</div>`;
        html += '<div class="day-appointments">';

        dayAppointments.slice(0, 3).forEach((appt) => {
            const statusClass = normalizeStatusClass(appt.status);
            const time = appt.appointmentTime || 'N/A';
            const name = appt.patientName || 'Unknown';
            html += `<span class="appointment-pill ${statusClass}">${time} ${name}</span>`;
        });

        if (dayAppointments.length > 3) {
            html += `<span class="appointment-pill">+${dayAppointments.length - 3} more</span>`;
        }

        html += '</div></div>';
    }

    const cellsFilled = startWeekDay + totalDays;
    const trailingCells = (7 - (cellsFilled % 7)) % 7;
    for (let i = 0; i < trailingCells; i++) {
        html += '<div class="calendar-day muted"></div>';
    }

    html += '</div>';
    calendarContent.innerHTML = html;

    if (monthLabel) {
        monthLabel.textContent = monthTitle(currentViewDate);
    }
}

async function loadAppointmentsForCurrentMonth() {
    if (!currentDoctorId) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const startKey = toDateKey(startDate);
    const endKey = toDateKey(endDate);

    appointmentsByDate = {};

    try {
        const snapshot = await db
            .collection('Appointments')
            .where('doctorId', '==', currentDoctorId)
            .where('appointmentDate', '>=', startKey)
            .where('appointmentDate', '<=', endKey)
            .get();

        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateKey = data.appointmentDate;
            if (!dateKey) return;

            if (!appointmentsByDate[dateKey]) {
                appointmentsByDate[dateKey] = [];
            }

            appointmentsByDate[dateKey].push({
                patientName: data.patientName || 'Unknown Patient',
                appointmentTime: data.appointmentTime || 'N/A',
                status: data.status || 'Pending'
            });
        });

        Object.keys(appointmentsByDate).forEach((dateKey) => {
            appointmentsByDate[dateKey].sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)));
        });

        renderCalendarGrid();
    } catch (error) {
        // Firestore may require a composite index for doctorId + appointmentDate range queries.
        // Fallback to doctor-only query and filter by month on client so UI still works.
        if (error && (error.code === 'failed-precondition' || error.code === 'permission-denied')) {
            try {
                const fallbackSnapshot = await db
                    .collection('Appointments')
                    .where('doctorId', '==', currentDoctorId)
                    .get();

                fallbackSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const dateKey = data.appointmentDate;
                    if (!dateKey || dateKey < startKey || dateKey > endKey) return;

                    if (!appointmentsByDate[dateKey]) {
                        appointmentsByDate[dateKey] = [];
                    }

                    appointmentsByDate[dateKey].push({
                        patientName: data.patientName || 'Unknown Patient',
                        appointmentTime: data.appointmentTime || 'N/A',
                        status: data.status || 'Pending'
                    });
                });

                Object.keys(appointmentsByDate).forEach((dateKey) => {
                    appointmentsByDate[dateKey].sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)));
                });

                renderCalendarGrid();
                return;
            } catch (fallbackError) {
                console.error('Fallback query failed:', fallbackError);
            }
        }

        console.error('Error loading monthly appointments:', error);
        renderEmpty('Failed to load appointment calendar. Check Firestore rules/index and try again.');
    }
}

async function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userDoc = await db.collection('Users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'doctor') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        currentDoctorId = await getDoctorIdForUser(user.uid);
        if (!currentDoctorId) {
            renderEmpty('Doctor profile not found. Please contact admin.');
            return;
        }

        if(doctorName){
            doctorName.textContent = `Dr. ${userDoc.data()?.name || 'Unknown'}`;
        }

        await loadAppointmentsForCurrentMonth();
    });
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', async () => {
        currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
        await loadAppointmentsForCurrentMonth();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', async () => {
        currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
        await loadAppointmentsForCurrentMonth();
    });
}

checkAuthState();

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