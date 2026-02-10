const totalUser = document.getElementById('total-user-section');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');

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
        loadTotalUsers();
    });
}

// If user is admin, load total users
async function loadTotalUsers() {
    // Fetch total users from Firestore
    db.collection('Users').get().then((querySnapshot) => {
        const userCount = querySnapshot.size;
        totalUser.innerHTML = `
            <div class="total-user">
                <h3>Total Users</h3>
                <p class="count-number">${userCount}</p>
            </div>
        `;
    }).catch((error) => {
        console.error('Error fetching total users:', error);
    });
}

checkAuthState();

function showLogoutConfirmation(){
    if(logoutPopup){
        logoutPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cancelLogout(){
    if(logoutPopup){
        logoutPopup.style.display = 'none';
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

