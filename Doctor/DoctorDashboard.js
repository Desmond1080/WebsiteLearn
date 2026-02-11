const doctorNameSpan = document.getElementById('doctor-name');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const doctorLogoutButton = document.getElementById('doctor-logout-button');



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

if(doctorLogoutButton){
    doctorLogoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        showLogoutConfirmation();
    });
}