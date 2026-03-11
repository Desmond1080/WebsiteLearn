const totalUser = document.getElementById('total-user-section');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const monthlyUserTable = document.getElementById('monthly-user-table');
const totalStaff = document.getElementById('total-staff-section');
const appointmentsChartCanvas = document.getElementById('appointmentsChart');
// notification 
const notificationBell = document.getElementById('notification-bell');
const notificationBadge = document.getElementById('notification-badge');
const notificationPanel = document.getElementById('notification-panel');
const notificationPanelList = document.getElementById('notification-panel-list');
const markAllReadButton = document.getElementById('mark-all-read-button');

let appointmentsChartInstance = null;
let unreadNotifications = null;
let listenerUnsubscribe = null;
let currentUserId = null;

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
        subscribeAdminNotifications(user.uid);
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
        if(totalUser){
            totalUser.innerHTML = userListHTML;
        }
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
    if(monthlyUserTable){
        monthlyUserTable.innerHTML = monthlyUserHTML;
    }
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

// notification time 
function formatTimestamp(timestamp) {
    if (!timestamp) {
        return 'just now';
    }

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date.getTime(); // difference in milliseconds
    const min = Math.floor(diff / 60000); // minutes

    if (min < 1) return 'just now';
    if (min < 60) return `${min} minute${min > 1 ? 's' : ''} ago`;

    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} hour${hour > 1 ? 's' : ''} ago`;

    const day = Math.floor(hour / 24);
    if(day < 7) return `${day} day${day > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

function renderNotifications(docs){
    if(!notificationPanelList){
        return;
    }

    if(!docs.length){
        notificationPanelList.innerHTML = '<p class="no-notifications">No notifications</p>';
        return;
    }

    notificationPanelList.innerHTML = docs.map(doc => {
        const data = doc.data();
        const unread = data.isRead ? '' : 'unread';
        const safeTitle = data.title || 'Notification';
        const safeMessage = data.message || '';
        const timeText = formatTimestamp(data.createdAt);
        return `<div class="notification-item ${unread}" data-id="${doc.id}" data-target="${data.target || ''}">
                    <h4>${safeTitle}</h4>
                    <p>${safeMessage}</p>
                    <span class="notification-time">${timeText}</span>
                </div>`
    }),join('');
}

// mark as read function
async function markSingleNotificationAsRead(notificationId){
    try{
        await db.collection('Notifications').doc(notificationId).update({
            isRead: true
        })
    } catch(error){
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead(){
    if(!currentUserId){
        return;
    }

    try{
        const unreadSnapshot = await db.collection('Notifications').where('userId', '==', currentUserId).where('isRead', '==', false).get();
        const batch = db.batch();
        unreadSnapshot.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
    } catch(error){
        console.error('Error marking all notifications as read:', error);
    }
}

function subscribeAdminNotifications(userId){
    currentUserId = userId;
    
    if(unreadNotifications) unreadNotifications();
    if(listenerUnsubscribe) listenerUnsubscribe();

    unreadNotifications = db.collection('Notifications').where('userId', '==', userId).where('isRead', '==', false).onSnapshot((snap) => {
        const count = snap.size;
        if(!notificationBadge) return;
        if(count > 0){
            notificationBadge.style.display = 'block';
            notificationBadge.textContent = count > 99 ? '99+' : String(count);
        } else {
            notificationBadge.style.display = 'none';
            notificationBadge.textContent = '0';
        }
    });
    
    listenerUnsubscribe = db.collection('Notifications').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(20).onSnapshot((snap) => {
        renderNotifications(snap.docs);
    });
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

if(notificationBell && notificationPanel){
    notificationBell.addEventListener('click', () => {
        event.preventDefault();
        const isOpen = notificationPanel.style.display === 'block';
        notificationPanel.style.display = isOpen ? 'none' : 'block';
    })
}

if(markAllReadButton){
    markAllReadButton.addEventListener('click', async () => {
        await markAllNotificationsAsRead();
    });
}

if(notificationPanelList){
    notificationPanelList.addEventListener('click', async (event) => {
        const item = event.target.closest('.notification-item');
        if(!item) return;

        const notificationId = item.getAttribute('data-id');
        const target = item.getAttribute('data-target');

        if(notificationId){
            await markSingleNotificationAsRead(notificationId);
        }

        if(target){
            window.location.href = target;
        }
    });
}

document.addEventListener('click', (event) => {
    if(!notificationPanel || !notificationBell) return;
    if(!notificationPanel.contains(event.target) && !notificationBell.contains(event.target)){
        notificationPanel.style.display = 'none';
    }
})
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

