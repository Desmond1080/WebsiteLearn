const doctorNameSpan = document.getElementById('doctor-name');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const doctorLogoutButton = document.getElementById('doctor-logout-button');


// notification 
const notificationBell = document.getElementById('notification-bell');
const notificationBadge = document.getElementById('notification-badge');
const notificationPanel = document.getElementById('notification-panel');
const notificationPanelList = document.getElementById('notification-panel-list');
const markAllReadButton = document.getElementById('mark-all-read-button');


console.log('DoctorDashboard.js loaded');
console.log('doctorLogoutButton:', doctorLogoutButton);
console.log('logoutPopup:', logoutPopup);

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
        if (userData?.role !== 'doctor') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        if (doctorNameSpan) {
            doctorNameSpan.textContent = userData?.name || user.email;
        }
        await loadAppointmentsNotifications();
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

// Function to get doctor ID based on user ID, trying both string and reference formats
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

// render notifications in the panel, change the ui of the notification bell if there are new notifications
async function renderNotifications(notifications) {
    notificationPanelList.innerHTML = '';
    if(notifications.length === 0){
        notificationPanelList.innerHTML = '<p>No new notifications</p>';
        notificationBadge.style.display = 'none';
        return;
    }
    notificationBadge.style.display = 'block';
    notifications.forEach(notification => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${notification.title}</strong><br>${notification.message}<br><small>${notification.createdAt.toDate().toLocaleString()}</small>`;
        notificationPanelList.appendChild(listItem);
        notificationBadge.textContent = notifications.length;
        notificationBadge.style.display = notifications.length > 0 ? 'block' : 'none';
    }
    );

}

//show appointment confirmation booked notification 
async function loadAppointmentsNotifications() {
    try{
        console.log('Loading appointment notifications');
        const user = auth.currentUser;
        if(!user) return;
        const currentDoctorId = await getDoctorIdForUser(user.uid);
        if(!currentDoctorId) return;
        const notificationsSnapshot = await db.collection('Notifications').get();
        const notifications = [];
        notificationsSnapshot.forEach(doc => {
            const data = doc.data();
            if(data.doctorId === currentDoctorId && !data.isRead) {
                notifications.push({ id: doc.id, ...data });
            }
        });
        renderNotifications(notifications);
    } catch (error) {
        console.error('Error loading appointments notifications:', error);
    }
}

// button to show notifications panel
if(notificationBell){
    notificationBell.addEventListener('click', () => {
        if(notificationPanel){
            notificationPanel.classList.toggle('visible');
        }
    });
}



// update badge and panel when mark all as read is clicked
if(markAllReadButton){
    markAllReadButton.addEventListener('click', async () => {
        try{
            const user = auth.currentUser;
            if(!user) return;
            const currentDoctorId = await getDoctorIdForUser(user.uid);
            if(!currentDoctorId) return;
            const notificationsSnapshot = await db.collection('Notifications').where('doctorId', '==', currentDoctorId).where('isRead', '==', false).get();
            const batch = db.batch();
            notificationsSnapshot.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            }
            );
            await batch.commit();
            renderNotifications([]);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    });
}


