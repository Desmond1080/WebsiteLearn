const adminProfile = document.getElementById('admin-profile-content');
const adminNameEl = document.getElementById('admin-name');
const adminNameInput = document.getElementById('admin-name-input');
const adminUsernameInput = document.getElementById('admin-username-input');
const adminDescriptionInput = document.getElementById('admin-description-input');
const adminGenderInput = document.getElementById('admin-gender-input');
const adminEmailInput = document.getElementById('admin-email-input');
const adminStreetInput = document.getElementById('admin-street-input');
const adminCityInput = document.getElementById('admin-city-input');
const adminStateInput = document.getElementById('admin-state-input');
const adminPostalInput = document.getElementById('admin-postal-input');
const adminCountryInput = document.getElementById('admin-country-input');
const adminPhoneInput = document.getElementById('admin-phone-input');
const adminRoleInput = document.getElementById('admin-role-input');
const saveAdminProfileButton = document.getElementById('save-admin-profile-button');
const logoutButton = document.getElementById('admin-logout-button');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-new-password');
let adminDocUnsubscribe = null;

const countryStateMap = {
    Malaysia: [
        'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 'Negeri Sembilan',
        'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
    ],
    Singapore: ['N/A'],
    Indonesia: [
        'Aceh', 'Bali', 'Banten', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
        'Kalimantan Barat', 'Kalimantan Selatan', 'Papua', 'Sulawesi Selatan', 'Sumatera Utara', 'Yogyakarta'
    ],
    Thailand: [
        'Bangkok', 'Chiang Mai', 'Chiang Rai', 'Chonburi', 'Khon Kaen', 'Nakhon Ratchasima', 'Phuket', 'Songkhla'
    ],
    'United States': ['California', 'Florida', 'Illinois', 'New York', 'Texas', 'Washington'],
    China: [
        'Anhui', 'Fujian', 'Gansu', 'Guangdong', 'Guizhou', 'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hubei', 'Hunan','Jiangsu','Jiangxi','Jilin','Liaoning','Qinghai','Shaanxi','Shandong','Shanxi','Sichuan','Yunnan','Zhejiang'],
};

// Store original profile data for change detection
let originalProfileData = {};

console.log('AdminProfile.js loaded, adminProfile element:', adminProfile);

function isPhoneNumberValid(phone) {
    return /^\d+$/.test(phone);
}

function isEmailValid(email) {
    // Practical check for public email formats (not full RFC parser)
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function enforceMaxLength(inputElement, maxLength) {
    if (!inputElement) return;
    inputElement.addEventListener('input', () => {
        if (inputElement.value.length > maxLength) {
            inputElement.value = inputElement.value.slice(0, maxLength);
        }
    });
}

if (adminPhoneInput) {
    adminPhoneInput.addEventListener('input', () => {
        const digitsOnly = adminPhoneInput.value.replace(/\D/g, '');
        if (adminPhoneInput.value !== digitsOnly) {
            adminPhoneInput.value = digitsOnly;
        }
    });
}

enforceMaxLength(adminNameInput, 100);
enforceMaxLength(adminUsernameInput, 30);
enforceMaxLength(adminDescriptionInput, 200);
enforceMaxLength(adminEmailInput, 254);
enforceMaxLength(adminStreetInput, 100);
enforceMaxLength(adminCityInput, 50);
enforceMaxLength(adminPostalInput, 10);
enforceMaxLength(adminPhoneInput, 11);

function populateCountryOptions(selectedCountry = '') {
    if (!adminCountryInput) return;

    adminCountryInput.innerHTML = '<option value="">Select Country</option>';
    Object.keys(countryStateMap).forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        adminCountryInput.appendChild(option);
    });

    adminCountryInput.value = selectedCountry || '';
}

function populateStateOptions(country = '', selectedState = '') {
    if (!adminStateInput) return;

    const states = countryStateMap[country] || [];
    adminStateInput.innerHTML = '<option value="">Select State</option>';

    states.forEach((state) => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        adminStateInput.appendChild(option);
    });

    if (selectedState && !states.includes(selectedState)) {
        const customOption = document.createElement('option');
        customOption.value = selectedState;
        customOption.textContent = selectedState;
        adminStateInput.appendChild(customOption);
    }

    adminStateInput.value = selectedState || '';
}

if (adminCountryInput) {
    populateCountryOptions('');
    populateStateOptions('', '');

    adminCountryInput.addEventListener('change', () => {
        populateStateOptions(adminCountryInput.value, '');
        adminStateInput.disabled = !adminCountryInput.value;
    });
}

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

// Show profile update success modal
function showProfileSuccess() {
    console.log('showProfileSuccess() called');
    const successContainer = document.getElementById('update-successful-container');
    console.log('Success container element:', successContainer);
    if (successContainer) {
        console.log('Showing success modal');
        successContainer.style.display = 'flex';
    } else {
        console.error('Success container element not found!');
    }
}

// Close success message modal
function closeSuccessMessage() {
    const successContainer = document.getElementById('update-successful-container');
    if (successContainer) {
        successContainer.style.display = 'none';
    }
}

// Show notification when trying to edit while already in edit mode
function showEditModeNotification() {
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        // Add pulse animation
        editBtn.classList.add('already-editing');
        
        // Remove after animation completes
        setTimeout(() => {
            editBtn.classList.remove('already-editing');
        }, 600);
    }
    
    // You could also show a toast message here
    console.log('Already in edit mode');
}

function subscribeToAdminProfile(user) {
    if (!user) return;

    if (adminDocUnsubscribe) {
        adminDocUnsubscribe();
        adminDocUnsubscribe = null;
    }

    adminDocUnsubscribe = db.collection('Users').doc(user.uid).onSnapshot((doc) => {
        if (!doc.exists) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userData = doc.data();

        if (userData?.role !== 'admin') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        if (adminNameEl) {
            adminNameEl.textContent = userData?.name || user.displayName || user.email || 'Admin';
        }
    }, (error) => {
        console.error('Error listening to admin profile:', error);
        if (adminNameEl) {
            adminNameEl.textContent = user.displayName || user.email || 'Admin';
        }
    });
}

// check auth state
async function checkAuthState() {
    console.log('checkAuthState() called');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed, user:', user?.uid);
        if (!user) {
            if (adminDocUnsubscribe) {
                adminDocUnsubscribe();
                adminDocUnsubscribe = null;
            }
            console.log('No user, redirecting to login');
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        subscribeToAdminProfile(user);

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
                <button id="edit-profile-btn" onclick="enableProfileEditing()">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
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
    // Get the edit button
    const editBtn = document.getElementById('edit-profile-btn');
    
    // Check if already in edit mode
    if (!adminNameInput.disabled) {
        // Already in edit mode, show notification
        showEditModeNotification();
        return;
    }
    
    adminNameInput.disabled = false;
    adminUsernameInput.disabled = false;
    adminDescriptionInput.disabled = false;
    adminGenderInput.disabled = false;
    // Email should stay disabled - it's tied to Firebase Auth
    // adminEmailInput.disabled = false;
    adminStreetInput.disabled = false;
    adminCityInput.disabled = false;
    adminStateInput.disabled = false;
    adminPostalInput.disabled = false;
    adminCountryInput.disabled = false;
    adminPhoneInput.disabled = false;
    // Role should stay disabled - security concern
    // adminRoleInput.disabled = false;

    saveAdminProfileButton.style.display = 'block';
    
    // Update button to show edit mode is active
    if (editBtn) {
        editBtn.disabled = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editing...';
        editBtn.classList.add('editing-active');
    }

    if (!adminCountryInput.value) {
        adminStateInput.disabled = true;
    }
}

function cancelEdit(){
    // Restore original values
    if (originalProfileData) {
        adminNameInput.value = originalProfileData.name || '';
        adminUsernameInput.value = originalProfileData.username || '';
        adminDescriptionInput.value = originalProfileData.description || '';
        adminGenderInput.value = originalProfileData.gender || '';
        adminEmailInput.value = originalProfileData.email || '';
        adminPhoneInput.value = originalProfileData.phoneNumber || '';
        
        // Restore address fields
        adminStreetInput.value = originalProfileData.street || '';
        adminCityInput.value = originalProfileData.city || '';
        adminPostalInput.value = originalProfileData.postalCode || '';
        populateCountryOptions(originalProfileData.country || '');
        adminCountryInput.value = originalProfileData.country || '';
        populateStateOptions(adminCountryInput.value, originalProfileData.state || '');
    }
    
    // Disable fields
    adminNameInput.disabled = true;
    adminUsernameInput.disabled = true;
    adminDescriptionInput.disabled = true;
    adminGenderInput.disabled = true;
    adminEmailInput.disabled = true;
    adminStreetInput.disabled = true;
    adminCityInput.disabled = true;
    adminStateInput.disabled = true;
    adminPostalInput.disabled = true;
    adminCountryInput.disabled = true;
    adminPhoneInput.disabled = true;
    adminRoleInput.disabled = true;

    saveAdminProfileButton.style.display = 'none';
    
    // Re-enable the edit button
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.disabled = false;
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        editBtn.classList.remove('editing-active');
    }
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
                    adminPhoneInput.value = data.phoneNumber || '';
                    adminRoleInput.value = data.role || '';
                    
                    // Split address into separate fields (legacy format had no country)
                    const address = data.address || '';
                    if (address) {
                        const addressParts = address.split(',').map(part => part.trim());
                        const street = addressParts[0] || '';
                        const city = addressParts[1] || '';
                        const state = addressParts[2] || '';
                        const postalCode = addressParts[3] || '';
                        const country = addressParts.length >= 5 ? (addressParts[4] || '') : 'Malaysia';

                        adminStreetInput.value = street;
                        adminCityInput.value = city;
                        adminPostalInput.value = postalCode;
                        populateCountryOptions(country);
                        adminCountryInput.value = country;
                        populateStateOptions(country, state);
                    } else {
                        adminStreetInput.value = '';
                        adminCityInput.value = '';
                        adminPostalInput.value = '';
                        populateCountryOptions('');
                        adminCountryInput.value = '';
                        populateStateOptions('', '');
                    }
                    
                    // Store original data for change detection
                    originalProfileData = {
                        name: data.name || '',
                        username: data.username || '',
                        description: data.description || '',
                        gender: data.gender || '',
                        email: data.email || '',
                        street: adminStreetInput.value || '',
                        city: adminCityInput.value || '',
                        state: adminStateInput.value || '',
                        postalCode: adminPostalInput.value || '',
                        country: adminCountryInput.value || '',
                        phoneNumber: data.phoneNumber || ''
                    };
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
        const street = adminStreetInput.value.trim();
        const city = adminCityInput.value.trim();
        const state = adminStateInput.value.trim();
        const postalCode = adminPostalInput.value.trim();
        const country = adminCountryInput.value.trim();
        const phone = adminPhoneInput.value.trim();

        if(!name || !username){
            alert('Name and Username are required');
            return;
        }

        // Check if any changes were made (email excluded - not editable)
        const hasChanges = (
            name !== originalProfileData.name ||
            username !== originalProfileData.username ||
            description !== originalProfileData.description ||
            gender !== originalProfileData.gender ||
            street !== originalProfileData.street ||
            city !== originalProfileData.city ||
            state !== originalProfileData.state ||
            postalCode !== originalProfileData.postalCode ||
            country !== originalProfileData.country ||
            phone !== originalProfileData.phoneNumber
        );

        if (!hasChanges) {
            alert('No changes detected');
            return;
        }

        // validate name length to prevent excessively long names that could break the layout
        if(name.length > 100){
            alert('Name must be less than 100 characters');
            return;
        }

        // validate username length and format (alphanumeric and underscores only)
        if(username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)){
            alert('Username must be less than 30 characters and can only contain letters, numbers, and underscores');
            return;
        }

        // validate description length if exceed to length of characters stop from typing and alert user
        if(description.length > 200){
            alert('Description must be less than 200 characters');
            return;
        }

        if (phone && !isPhoneNumberValid(phone)) {
            alert('Phone number must contain digits only');
            return;
        }

        // validate phone number length for malaysia context 
        if (phone && (phone.length < 10 || phone.length > 11)) {
            alert('Phone number must be between 10 and 11 digits');
            return;
        } 


        // validate post code can only contain digits and have a length of 5 or 6 characters
        if (postalCode && (!/^\d{5,6}$/.test(postalCode))) {
            alert('Postal code must contain only digits and be 5 or 6 characters long');
            return;
        }

        if (!country) {
            alert('Please select a country');
            return;
        }

        if (!state) {
            alert('Please select a state');
            return;
        }

        // Combine address fields into a single string
        const addressParts = [street, city, state, postalCode, country].filter(part => part);
        const address = addressParts.join(', ');

        // Prepare data to update (email excluded - tied to Firebase Auth)
        const updateData = {
            name,
            username,
            description,
            gender,
            address,
            phoneNumber: phone
        };
        
        // Note: email is not included because it's tied to Firebase Authentication
        // To change email, use Firebase Auth's updateEmail() method with re-authentication

        console.log('Saving profile data:', updateData);

        // Update Firestore
        db.collection('Users').doc(user.uid).update(updateData)
            .then(() => {
                console.log('Profile updated successfully');
                
                // Update original data after successful save
                originalProfileData = {
                    name: name,
                    username: username,
                    description: description,
                    gender: gender,
                    email: originalProfileData.email, // Keep original email
                    street: street,
                    city: city,
                    state: state,
                    postalCode: postalCode,
                    country: country,
                    phoneNumber: phone
                };
                
                // Show success modal instead of alert
                showProfileSuccess();
                
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

function initializeEnterToSaveProfile() {
    const editProfileSection = document.getElementById('edit-admin-profile');
    if (!editProfileSection) return;

    editProfileSection.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;

        const targetTag = event.target.tagName;
        if (targetTag === 'BUTTON' || targetTag === 'TEXTAREA') return;

        // Trigger save only when profile form is currently editable
        if (!adminNameInput.disabled && saveAdminProfileButton.style.display !== 'none') {
            event.preventDefault();
            saveProfile();
        }
    });
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
initializeEnterToSaveProfile();
checkAuthState();

function showLogoutConfirmation(){
    if(confirm('Are you sure you want to logout?')){
        confirmLogout();
    }
}

async function confirmLogout(){
    try{
        if (adminDocUnsubscribe) {
            adminDocUnsubscribe();
            adminDocUnsubscribe = null;
        }
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