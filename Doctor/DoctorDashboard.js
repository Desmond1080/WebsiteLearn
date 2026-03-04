const doctorNameSpan = document.getElementById('doctor-name');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const doctorLogoutButton = document.getElementById('doctor-logout-button');

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
