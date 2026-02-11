const totalUser = document.getElementById('total-user-section');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const monthlyUserTable = document.getElementById('monthly-user-table');
const totalStaff = document.getElementById('total-staff-section');
const appointmentsChartCanvas = document.getElementById('appointmentsChart');
let appointmentsChartInstance = null;

//check auth state
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
        if (userData?.role !== 'admin') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        if (adminNameEl) {
            adminNameEl.textContent = userData?.name || user.email;
        }
        loadUserNames();
        loadMonthlyUser();
        loadStaffNames();
        loadAppointmentPerMonth();
    });
}


//load each user name after checking the role is it user , as a table 
async function loadUserNames(){
    try {
        // fetch each user name from firestore and display as table 
        const usersSnapshot = await db.collection('Users').where('role', '==', 'user').get();
        let userListHTML = '<table><tr><th>User Name</th><th>Email</th></tr>';
        
        const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

        if (!usersSnapshot.empty) {
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                userListHTML += `<tr><td>${userData.name || 'N/A'}</td><td>${userData.email || 'N/A'}</td></tr>`;
            });
        } else {
            const allUsersSnapshot = await db.collection('Users').get();
            const roleCounts = {};
            const normalizedUsers = [];

            allUsersSnapshot.forEach((doc) => {
                const userData = doc.data();
                const role = userData?.role ?? '(missing)';
                const normalizedRole = normalizeRole(role);

                roleCounts[String(role)] = (roleCounts[String(role)] || 0) + 1;
                if (normalizedRole === 'user') {
                    normalizedUsers.push(userData);
                }
            });

            console.log('Role counts in Users:', roleCounts);

            if (normalizedUsers.length === 0) {
                userListHTML += '<tr><td colspan="2">No users found</td></tr>';
            } else {
                normalizedUsers.forEach((userData) => {
                    userListHTML += `<tr><td>${userData.name || 'N/A'}</td><td>${userData.email || 'N/A'}</td></tr>`;
                });
            }
        }
        userListHTML += '</table>';
        totalUser.innerHTML = userListHTML;
    } catch(error) {
        console.error('Error loading users:', error);
        if (totalUser) {
            totalUser.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }
}

// each month new user joined table
async function loadMonthlyUser(){
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const usersSnapshot = await db.collection('Users').get();
    let monthlyUserCount = 0;
    let monthlyUserHTML = '<table><tr><th>User Name</th><th>Email</th><th>Join Date</th></tr>';

    console.log('Monthly users: total docs', usersSnapshot.size, 'month index', currentMonth, 'year', currentYear);

    if(!usersSnapshot.empty){
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const createdAt = userData.createdAt ? userData.createdAt.toDate() : null;
            if(!createdAt){
                console.log('Monthly users: missing createdAt', doc.id);
            }
            if(createdAt && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear){
                const monthYearLabel = createdAt.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
                monthlyUserCount++;
                monthlyUserHTML += `<tr><td>${userData.name || 'N/A'}</td><td>${userData.email || 'N/A'}</td><td>${monthYearLabel}</td></tr>`;
            }
        });
    } else {
        monthlyUserHTML += '<tr><td colspan="3">No users found</td></tr>';
    }
    if(usersSnapshot.empty === false && monthlyUserCount === 0){
        monthlyUserHTML += '<tr><td colspan="3">No users joined this month</td></tr>';
    }
    console.log('Monthly users: matched', monthlyUserCount);
    monthlyUserHTML += '</table>';
    monthlyUserTable.innerHTML = monthlyUserHTML;
}

// load each staff name after checking the role is doctor, admin or etc
async function loadStaffNames(){
    let staffListHTML = '<table><tr><th>Staff Name</th><th>Email</th><th>Role</th></tr>';
    try{
        const staffSnapshot = await db.collection('Users')
            .where('role', 'in', ['admin', 'doctor'])
            .get();

        console.log('Staff users: total docs', staffSnapshot.size);

        if(!staffSnapshot.empty){
            staffSnapshot.forEach((doc) => {
                const staffData = doc.data();
                staffListHTML += `<tr><td>${staffData.name || 'N/A'}</td><td>${staffData.email || 'N/A'}</td><td>${staffData.role || 'N/A'}</td></tr>`;
            });
        } else {
            staffListHTML += '<tr><td colspan="3">No staff found</td></tr>';
        }
    }catch(error){
        console.error('Error loading staff:', error);
        staffListHTML += '<tr><td colspan="3">Error loading staff</td></tr>';
    }
    if(totalStaff){
        totalStaff.innerHTML = staffListHTML + '</table>';
    }
}

// load appointment per month and show in bar chart 
async function loadAppointmentPerMonth(){
    const now = new Date();
    const currentYear = now.getFullYear();
    const appointmentCounts = Array(12).fill(0);

    if(!appointmentsChartCanvas){
        console.warn('Appointments chart canvas not found.');
        return;
    }

    const appointmentsSnapshot = await db.collection('Appointments').get();
    appointmentsSnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        const appointmentDate = appointmentData?.appointmentDate
            ? new Date(`${appointmentData.appointmentDate}T00:00:00`)
            : null;
        const createdAt = appointmentData?.createdAt ? appointmentData.createdAt.toDate() : null;
        const dateToUse = appointmentDate || createdAt;

        if(!dateToUse || Number.isNaN(dateToUse.getTime())){
            return;
        }

        if(dateToUse.getFullYear() !== currentYear){
            return;
        }

        const monthIndex = dateToUse.getMonth();
        appointmentCounts[monthIndex] += 1;
    });

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if(appointmentsChartInstance){
        appointmentsChartInstance.destroy();
    }

    appointmentsChartInstance = new Chart(appointmentsChartCanvas, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: `Appointments (${currentYear})`,
                data: appointmentCounts,
                backgroundColor: '#667eea',
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

checkAuthState();

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

document.addEventListener('DOMContentLoaded', setActiveNavLink);

