const notificationList = document.getElementById('notification-list');

// Wait for user authentication, then load notifications
auth.onAuthStateChanged((user) => {
    if (user) {
        loadNotifications();
    } else {
        notificationList.innerHTML = '<p>Please log in to view your notifications.</p>';
    }
});

// Load and display notifications
async function loadNotifications() {
    const user = auth.currentUser;
    const userId = user ? user.uid : null;
    
    if (!user) {
        notificationList.innerHTML = '<p>Please log in to view your notifications.</p>';
        return;
    }
    
    notificationList.innerHTML = '<p>Loading notifications...</p>';
    
    try {
        await db.collection("Notifications")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get()
            .then((querySnapshot) => {
                notificationList.innerHTML = "";
                
                if (querySnapshot.empty) {
                    notificationList.innerHTML = '<p>No notifications found.</p>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const notification = doc.data();
                    const notificationId = doc.id;
                    const timestamp = notification.createdAt ? 
                        notification.createdAt.toDate().toLocaleString() : 'Just now';
                    
                    const notificationItem = `
                        <div class="notification-item ${notification.isRead ? 'read' : 'unread'}">
                            <div class="notification-content">
                                <h3>${notification.title}</h3>
                                <p>${notification.message}</p>
                                <span class="notification-time">${timestamp}</span>
                            </div>
                            ${!notification.isRead ? `
                                <button class="mark-read-btn" onclick="markAsRead('${notificationId}')">
                                    Mark as Read
                                </button>
                            ` : ''}
                        </div>
                    `;
                    notificationList.innerHTML += notificationItem;
                });
            });
    } catch (error) {
        console.error("Error loading notifications: ", error);
        notificationList.innerHTML = '<p>Error loading notifications. Please try again.</p>';
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        await db.collection("Notifications").doc(notificationId).update({
            isRead: true
        });
        // Reload notifications
        loadNotifications();
    } catch (error) {
        console.error("Error marking notification as read: ", error);
        alert("Failed to update notification.");
    }
}

// Helper function to create a notification (used by other pages)
async function createNotification(userId, title, message) {
    try {
        await db.collection("Notifications").add({
            userId: userId,
            title: title,
            message: message,
            isRead: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Notification created successfully");
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
}
