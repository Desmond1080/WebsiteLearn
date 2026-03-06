const adminProfile = document.getElementById('admin-profile-content');
const adminNameInput = document.getElementById('admin-name-input');
const adminUsernameInput = document.getElementById('admin-username-input');
const adminDescriptionInput = document.getElementById('admin-description-input');
const adminGenderInput = document.getElementById('admin-gender-input');
const adminEmailInput = document.getElementById('admin-email-input');
const adminAddressInput = document.getElementById('admin-address-input');
const adminPhoneInput = document.getElementById('admin-phone-input');
const adminRoleInput = document.getElementById('admin-role-input');
const saveAdminProfileButton = document.getElementById('save-admin-profile-button');
const logoutButton = document.getElementById('admin-logout-button');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-new-password');

console.log('AdminProfile.js loaded, adminProfile element:', adminProfile);

// Tab switching function
function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const clickedButton = event.target.closest('.tab-button');
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.target;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Clear password fields
function clearPasswordFields() {
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    // Clear messages
    const errorMsg = document.getElementById('password-error-message');
    const successMsg = document.getElementById('password-success-message');
    if (errorMsg) errorMsg.classList.remove('show');
    if (successMsg) successMsg.classList.remove('show');
}

// Show error message
function showPasswordError(message) {
    const errorMsg = document.getElementById('password-error-message');
    const successMsg = document.getElementById('password-success-message');
    
    if (successMsg) successMsg.classList.remove('show');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 5000);
    }
}

// Show success message
function showPasswordSuccess(message) {
    const errorMsg = document.getElementById('password-error-message');
    const successMsg = document.getElementById('password-success-message');
    
    if (errorMsg) errorMsg.classList.remove('show');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 5000);
    }
}

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
        editProfile(); // Call editProfile to populate the form with current profile data
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
                <button onclick="enableProfileEditing()">Edit Profile</button>
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

// enable form fields for editing and populate with current profile data
function enableProfileEditing(){
    adminNameInput.disabled = false;
    adminUsernameInput.disabled = false;
    adminDescriptionInput.disabled = false;
    adminGenderInput.disabled = false;
    adminEmailInput.disabled = false;
    adminAddressInput.disabled = false;
    adminPhoneInput.disabled = false;
    adminRoleInput.disabled = false;

    saveAdminProfileButton.style.display = 'block';
}

function cancelEdit(){
    adminNameInput.disabled = true;
    adminUsernameInput.disabled = true;
    adminDescriptionInput.disabled = true;
    adminGenderInput.disabled = true;
    adminEmailInput.disabled = true;
    adminAddressInput.disabled = true;
    adminPhoneInput.disabled = true;
    adminRoleInput.disabled = true;

    saveAdminProfileButton.style.display = 'none';

}

//show edit profile form details first, then allow to change when click edit profile button
function editProfile(){
    const editProfileSection = document.getElementById('edit-admin-profile');

    if(editProfileSection){
        editProfileSection.style.display = 'block';
        // Populate form fields with current profile data
        const user = auth.currentUser;
        if(user){
            db.collection('Users').doc(user.uid).get().then((doc) => {
                if(doc.exists){
                    const data = doc.data();

                    adminNameInput.value = data.name || '';
                    adminUsernameInput.value = data.username || '';
                    adminDescriptionInput.value = data.description || '';
                    adminGenderInput.value = data.gender || '';
                    adminEmailInput.value = data.email || '';
                    adminAddressInput.value = data.address || '';
                    adminPhoneInput.value = data.phoneNumber || '';
                    adminRoleInput.value = data.role || '';
                }
            }).catch((error) => {
                console.error('Error fetching user data for edit:', error);
            });
        }
    }
}

function saveProfile(){
    console.log('saveProfile() called');
    try{
        const user = auth.currentUser;
        if(!user){
            alert('No user logged in');
            return;
        }

        // Validate inputs
        const name = adminNameInput.value.trim();
        const username = adminUsernameInput.value.trim();
        const description = adminDescriptionInput.value.trim();
        const gender = adminGenderInput.value.trim();
        const email = adminEmailInput.value.trim();
        const address = adminAddressInput.value.trim();
        const phone = adminPhoneInput.value.trim();

        if(!name || !username){
            alert('Name and Username are required');
            return;
        }

        // Prepare data to update
        const updateData = {
            name,
            username,
            description,
            gender,
            email,
            address,
            phone
        };

        console.log('Saving profile data:', updateData);

        // Update Firestore
        db.collection('Users').doc(user.uid).update(updateData)
            .then(() => {
                console.log('Profile updated successfully');
                alert('Profile saved successfully!');
                
                // Refresh the profile display
                fetchAdminProfile();
                
                // Disable form fields and hide save button
                cancelEdit();
            })
            .catch((error) => {
                console.error('Error saving profile:', error);
                alert('Error saving profile: ' + error.message);
            });
    }catch(error){
        console.error('Error in saveProfile():', error);
        alert('Error: ' + error.message);
    }
}

async function updatePassword(){
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordError('All fields are required');
        return;
    }

    if (newPassword !== confirmPassword) {
        showPasswordError('New password and confirm password do not match');
        return;
    }

    if (currentPassword === newPassword) {
        showPasswordError('New password must be different from current password');
        return;
    }

    if (newPassword.length < 6) {
        showPasswordError('New password must be at least 6 characters long');
        return;
    }

    if (newPassword.length > 100) {
        showPasswordError('New password must be less than 100 characters long');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            showPasswordError('No user logged in');
            return;
        }

        // Disable button during update
        const updateBtn = document.getElementById('update-password-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        }

        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        
        showPasswordSuccess('Password updated successfully!');
        clearPasswordFields();
        
        // Re-enable button
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
        }
    } catch (error) {
        console.error('Error updating password:', error);
        
        let errorMessage = 'Error updating password';
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Current password is incorrect';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password';
        } else if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Please log out and log back in before changing your password';
        } else {
            errorMessage = error.message;
        }
        
        showPasswordError(errorMessage);
        
        // Re-enable button
        const updateBtn = document.getElementById('update-password-btn');
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
        }
    }
}
checkAuthState();

function showLogoutConfirmation(){
    if(confirm('Are you sure you want to logout?')){
        confirmLogout();
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