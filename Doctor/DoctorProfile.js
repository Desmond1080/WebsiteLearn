const doctorProfile = document.getElementById('doctor-profile-content');
const doctorNameEl = document.getElementById('doctor-name');
const doctorNameInput = document.getElementById('doctor-name-input');
const doctorUsernameInput = document.getElementById('doctor-username-input');
const doctorDescriptionInput = document.getElementById('doctor-description-input');
const doctorGenderInput = document.getElementById('doctor-gender-input');
const doctorEmailInput = document.getElementById('doctor-email-input');
const doctorStreetInput = document.getElementById('doctor-street-input');
const doctorCityInput = document.getElementById('doctor-city-input');
const doctorStateInput = document.getElementById('doctor-state-input');
const doctorPostalInput = document.getElementById('doctor-postal-input');
const doctorCountryInput = document.getElementById('doctor-country-input');
const doctorPhoneInput = document.getElementById('doctor-phone-input');
const doctorRoleInput = document.getElementById('doctor-role-input');
const saveDoctorProfileButton = document.getElementById('save-doctor-profile-button');
const logoutButton = document.getElementById('doctor-logout-button');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-new-password');
let doctorDocUnsubscribe = null;

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

if (doctorPhoneInput) {
    doctorPhoneInput.addEventListener('input', () => {
        const digitsOnly = doctorPhoneInput.value.replace(/\D/g, '');
        if (doctorPhoneInput.value !== digitsOnly) {
            doctorPhoneInput.value = digitsOnly;
        }
    });
}

enforceMaxLength(doctorNameInput, 100);
enforceMaxLength(doctorUsernameInput, 30);
enforceMaxLength(doctorDescriptionInput, 200);
enforceMaxLength(doctorEmailInput, 254);
enforceMaxLength(doctorStreetInput, 100);
enforceMaxLength(doctorCityInput, 50);
enforceMaxLength(doctorPostalInput, 10);
enforceMaxLength(doctorPhoneInput, 11);

function populateCountryOptions(selectedCountry = '') {
    if (!doctorCountryInput) return;

    doctorCountryInput.innerHTML = '<option value="">Select Country</option>';
    Object.keys(countryStateMap).forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        doctorCountryInput.appendChild(option);
    });

    doctorCountryInput.value = selectedCountry || '';
}

function populateStateOptions(country = '', selectedState = '') {
    if (!doctorStateInput) return;

    const states = countryStateMap[country] || [];
    doctorStateInput.innerHTML = '<option value="">Select State</option>';

    states.forEach((state) => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        doctorStateInput.appendChild(option);
    });

    if (selectedState && !states.includes(selectedState)) {
        const customOption = document.createElement('option');
        customOption.value = selectedState;
        customOption.textContent = selectedState;
        doctorStateInput.appendChild(customOption);
    }

    doctorStateInput.value = selectedState || '';
}

if (doctorCountryInput) {
    populateCountryOptions('');
    populateStateOptions('', '');

    doctorCountryInput.addEventListener('change', () => {
        populateStateOptions(doctorCountryInput.value, '');
        doctorStateInput.disabled = !doctorCountryInput.value;
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

function subscribeToDoctorProfile(user) {
    if (!user) return;

    if (doctorDocUnsubscribe) {
        doctorDocUnsubscribe();
        doctorDocUnsubscribe = null;
    }

    doctorDocUnsubscribe = db.collection('Users').doc(user.uid).onSnapshot((doc) => {
        if (!doc.exists) {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        const userData = doc.data();

        if (userData?.role !== 'doctor') {
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        if (doctorNameEl) {
            doctorNameEl.textContent = `Dr. ${userData?.name || user.displayName || user.email || 'Doctor'}`;
        }
    }, (error) => {
        console.error('Error listening to doctor profile:', error);
        if (doctorNameEl) {
            doctorNameEl.textContent = `Dr. ${user.displayName || user.email || 'Doctor'}`;
        }
    });
}

// check auth state
async function checkAuthState() {
    console.log('checkAuthState() called');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed, user:', user?.uid);
        if (!user) {
            if (doctorDocUnsubscribe) {
                doctorDocUnsubscribe();
                doctorDocUnsubscribe = null;
            }
            console.log('No user, redirecting to login');
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        subscribeToDoctorProfile(user);

        console.log('User authenticated, fetching profile');
        fetchDoctorProfile();
        loadProfilePicture();
        editProfile(); // Call editProfile to populate the form with current profile data
    });
}


// Display uploaded media
async function displayMedia(mediaId) {
  const response = await fetch(`/api/media/${mediaId}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // For images
  document.getElementById('mediaContainer').innerHTML = 
    `<img src="${url}" alt="uploaded media">`;
}

async function uploadProfilePicture(event) {
    const file = event.target.files[0];
    const user = auth.currentUser;

    if(!file){
        return;
    }

    if(!user){
        alert('No user logged in');
        return;
    }

    //validate file type 
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if(!validImageTypes.includes(file.type)){
        alert('Invalid file type. Please select an image (JPEG, PNG, GIF).');
        return;
    }

    //validate file size (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if(file.size > maxSizeInBytes){
        alert('File size exceeds 5MB. Please select a smaller image.');
        return;
    }

    try{
        // Upload file to Firebase Storage
        const storageRef = firebase.storage().ref();
        const profilePictureRef = storageRef.child(`profile_pictures/${user.uid}/${file.name}`);

        //upload file
        await profilePictureRef.put(file);

        // Get download URL
        const downloadURL = await profilePictureRef.getDownloadURL();

        // save URL to Firestore user document
        await db.collection("Users").doc(user.uid).update({
            imageUrl: downloadURL
        })

        document.getElementById('profile-picture').src = downloadURL;
        alert('Profile picture updated successfully!');
    } catch(error){
        console.error('Error uploading profile picture:', error);
        alert('Failed to upload profile picture: ' + error.message);
    }

}

async function loadProfilePicture(){
    const user = auth.currentUser;

    if(!user){
        return;
    }

    try{
        const userDocument = await db.collection("Users").doc(user.uid).get();
        const userData = userDocument.data();

        if(userData?.imageUrl){
            document.getElementById('profile-picture').src = userData.imageUrl;
        }
    } catch(error){
        console.error('Error loading profile picture:', error);
        alert('Failed to load profile picture: ' + error.message);
    }
}

async function updateNote(noteId){
    const user = auth.currentUser;

    if(!user){
        alert('No user logged in');
        return;
    }

    try{
        const targetNoteId = noteId || currentEditNoteId;
        if(!targetNoteId){
            alert('No note selected for update.');
            return;
        }

        const updatedNote = document.getElementById('edit-note-content').value;

        if(updatedNote.trim() === ''){
            alert('Note content cannot be empty.');
            return;
        }

        const noteRef = db.collection("note").doc(targetNoteId);
        const noteSnap = await noteRef.get();
        if(!noteSnap.exists){
            alert('Note not found or already deleted.');
            return;
        }

        await noteRef.update({
            content: updatedNote
        });

        fetchNotes();
        document.getElementById('edit-note-section').style.display = 'none'; // hide edit note section
        document.getElementById('app-section').style.display = 'block';
    } catch(error){
        console.error('Error updating note:', error);
        alert('Failed to update note: ' + error.message);
    }
}

// fetch doctor profile data if the user have doctor role 
async function fetchDoctorProfile(){
    try{
        console.log('fetchDoctorProfile() called');
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
        
        // Check if user has doctor role
        if(userData.role !== 'doctor'){
            console.log('User role is not doctor, actual role:', userData.role);
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }

        console.log('Doctor verified, profile element exists?', !!doctorProfile);
        
        if(doctorProfile){
            const html = `
                <button type="button" onclick="document.getElementById('profile-picture-input').click()" class="upload-button"><img id="profile-picture" src="../image/user.png" alt="Profile Picture" fetchpriority="high"></button>
                <input type="file" id="profile-picture-input" accept="image/*" style="display: none;" onchange="uploadProfilePicture(event)">       
                <p><strong>Name:</strong> ${userData.name || 'N/A'}</p>
                <p><strong>Role:</strong> ${userData.role || 'N/A'}</p>
                <button id="edit-profile-btn" onclick="enableProfileEditing()">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
            `;
            doctorProfile.innerHTML = html;
            console.log('Profile HTML inserted');
        } else {
            console.log('ERROR: doctorProfile element not found!');
        }
    } catch(error){
        console.error('Error fetching doctor profile:', error);
    }
}

// enable form fields for editing and populate with current profile data
function enableProfileEditing(){
    // Get the edit button
    const editBtn = document.getElementById('edit-profile-btn');
    
    // Check if already in edit mode
    if (!doctorNameInput.disabled) {
        // Already in edit mode, show notification
        showEditModeNotification();
        return;
    }
    
    doctorNameInput.disabled = false;
    doctorUsernameInput.disabled = false;
    doctorDescriptionInput.disabled = false;
    doctorGenderInput.disabled = false;
    // Email should stay disabled - it's tied to Firebase Auth
    // doctorEmailInput.disabled = false;
    doctorStreetInput.disabled = false;
    doctorCityInput.disabled = false;
    doctorStateInput.disabled = false;
    doctorPostalInput.disabled = false;
    doctorCountryInput.disabled = false;
    doctorPhoneInput.disabled = false;
    // Role should stay disabled - security concern
    // doctorRoleInput.disabled = false;

    saveDoctorProfileButton.style.display = 'block';
    
    // Update button to show edit mode is active
    if (editBtn) {
        editBtn.disabled = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Editing...';
        editBtn.classList.add('editing-active');
    }

    if (!doctorCountryInput.value) {
        doctorStateInput.disabled = true;
    }
}

function cancelEdit(){
    // Restore original values
    if (originalProfileData) {
        doctorNameInput.value = originalProfileData.name || '';
        doctorUsernameInput.value = originalProfileData.username || '';
        doctorDescriptionInput.value = originalProfileData.description || '';
        doctorGenderInput.value = originalProfileData.gender || '';
        doctorEmailInput.value = originalProfileData.email || '';
        doctorPhoneInput.value = originalProfileData.phoneNumber || '';
        
        // Restore address fields
        doctorStreetInput.value = originalProfileData.street || '';
        doctorCityInput.value = originalProfileData.city || '';
        doctorPostalInput.value = originalProfileData.postalCode || '';
        populateCountryOptions(originalProfileData.country || '');
        doctorCountryInput.value = originalProfileData.country || '';
        populateStateOptions(doctorCountryInput.value, originalProfileData.state || '');
    }
    
    // Disable fields
    doctorNameInput.disabled = true;
    doctorUsernameInput.disabled = true;
    doctorDescriptionInput.disabled = true;
    doctorGenderInput.disabled = true;
    doctorEmailInput.disabled = true;
    doctorStreetInput.disabled = true;
    doctorCityInput.disabled = true;
    doctorStateInput.disabled = true;
    doctorPostalInput.disabled = true;
    doctorCountryInput.disabled = true;
    doctorPhoneInput.disabled = true;
    doctorRoleInput.disabled = true;

    saveDoctorProfileButton.style.display = 'none';
    
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
    const editProfileSection = document.getElementById('edit-doctor-profile');

    if(editProfileSection){
        editProfileSection.style.display = 'block';
        // Populate form fields with current profile data
        const user = auth.currentUser;
        if(user){

            db.collection('Users').doc(user.uid).get().then((doc) => {
                if(doc.exists){
                    const data = doc.data();

                    doctorNameInput.value = data.name || '';
                    doctorUsernameInput.value = data.username || '';
                    doctorDescriptionInput.value = data.description || '';
                    doctorGenderInput.value = data.gender || '';
                    doctorEmailInput.value = data.email || '';
                    doctorPhoneInput.value = data.phoneNumber || '';
                    doctorRoleInput.value = data.role || '';
                    
                    // Split address into separate fields (legacy format had no country)
                    const address = data.address || '';
                    if (address) {
                        const addressParts = address.split(',').map(part => part.trim());
                        const street = addressParts[0] || '';
                        const city = addressParts[1] || '';
                        const state = addressParts[2] || '';
                        const postalCode = addressParts[3] || '';
                        const country = addressParts.length >= 5 ? (addressParts[4] || '') : 'Malaysia';

                        doctorStreetInput.value = street;
                        doctorCityInput.value = city;
                        doctorPostalInput.value = postalCode;
                        populateCountryOptions(country);
                        doctorCountryInput.value = country;
                        populateStateOptions(country, state);
                    } else {
                        doctorStreetInput.value = '';
                        doctorCityInput.value = '';
                        doctorPostalInput.value = '';
                        populateCountryOptions('');
                        doctorCountryInput.value = '';
                        populateStateOptions('', '');
                    }
                    
                    // Store original data for change detection
                    originalProfileData = {
                        name: data.name || '',
                        username: data.username || '',
                        description: data.description || '',
                        gender: data.gender || '',
                        email: data.email || '',
                        street: doctorStreetInput.value || '',
                        city: doctorCityInput.value || '',
                        state: doctorStateInput.value || '',
                        postalCode: doctorPostalInput.value || '',
                        country: doctorCountryInput.value || '',
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
        const name = doctorNameInput.value.trim();
        const username = doctorUsernameInput.value.trim();
        const description = doctorDescriptionInput.value.trim();
        const gender = doctorGenderInput.value.trim();
        const street = doctorStreetInput.value.trim();
        const city = doctorCityInput.value.trim();
        const state = doctorStateInput.value.trim();
        const postalCode = doctorPostalInput.value.trim();
        const country = doctorCountryInput.value.trim();
        const phone = doctorPhoneInput.value.trim();

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
                fetchDoctorProfile();
                
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
    const editProfileSection = document.getElementById('edit-doctor-profile');
    if (!editProfileSection) return;

    editProfileSection.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;

        const targetTag = event.target.tagName;
        if (targetTag === 'BUTTON' || targetTag === 'TEXTAREA') return;

        // Trigger save only when profile form is currently editable
        if (!doctorNameInput.disabled && saveDoctorProfileButton.style.display !== 'none') {
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