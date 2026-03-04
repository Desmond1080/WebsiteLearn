const adminProfile = document.getElementById('admin-profile-content');

console.log('AdminProfile.js loaded, adminProfile element:', adminProfile);

// check auth state
async function checkAuthState() {
    console.log('checkAuthState() called');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed, user:', user?.uid);
        if (!user) {
            console.log('No user, redirecting to login');
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        console.log('User authenticated, fetching profile');
        fetchAdminProfile();   
    });
}

// fetch admin profile data if the user have admin role 
async function fetchAdminProfile(){
    try{
        console.log('fetchAdminProfile() called');
        const user = auth.currentUser;
        console.log('Current user:', user?.uid);
        
        if(!user){
            console.log('No current user, redirecting');
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userDoc = await db.collection('Users').doc(user.uid).get();
        console.log('User doc retrieved:', userDoc.exists, userDoc.data());
        
        if(!userDoc.exists){
            console.log('User doc does not exist');
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userData = userDoc.data();
        console.log('User data:', userData);
        
        // Check if user has admin role
        if(userData.role !== 'admin'){
            console.log('User role is not admin, actual role:', userData.role);
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        console.log('Admin verified, profile element exists?', !!adminProfile);
        
        if(adminProfile){
            const html = `
                <p><strong>Name:</strong> ${userData.name || 'N/A'}</p>
                <p><strong>Role:</strong> ${userData.role || 'N/A'}</p>
                <button>Edit Profile</button>
            `;
            adminProfile.innerHTML = html;
            console.log('Profile HTML inserted');
        } else {
            console.log('ERROR: adminProfile element not found!');
        }
    } catch(error){
        console.error('Error fetching admin profile:', error);
    }
}

checkAuthState();