
const totalUsers = document.getElementById('user-list-content');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const editUserNameInput = document.getElementById('edit-user-name');
const editUserUsernameInput = document.getElementById('edit-user-username');
const editUserGenderInput = document.getElementById('edit-user-gender');
const editUserEmailInput = document.getElementById('edit-user-email');
const addUserGenderSelect = document.getElementById('add-user-gender');
let currentEditUserId = null;
let isUserUpdateInProgress = false;
let lastUserUpdateAttemptAt = 0;
const USER_UPDATE_COOLDOWN_MS = 1200;

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
        loadUsers();
    });
}


async function loadUsers(){
    try{
        const usersSnapshot = await db.collection('Users').get();
        const usersProfileSnapshot = await db.collection('Users').get();
        
        if(usersSnapshot.empty){
            console.log('Users: Users collection is empty');
            return;
        }
        if(usersProfileSnapshot.empty){
            console.log('Users: No users with role=user found');
            return;
        }
        
        console.log('Users: First 3 Users doc IDs:', usersProfileSnapshot.docs.map(d => d.id).slice(0, 3));
        console.log('Users: First 3 Users userId values:', usersSnapshot.docs.map(d => d.data().userId).slice(0, 3));
        console.log('Users: First user doc sample:', usersProfileSnapshot.docs[0]?.data());
        
        let userListHTML = `<table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Gender</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        if(!usersSnapshot.empty && !usersProfileSnapshot.empty){
            const userProfiles = {};
            usersProfileSnapshot.docs.forEach(element => {
                const userProfileData = element.data();
                userProfiles[element.id] = userProfileData;
            });
            
            // Create fallback join by email
            const userProfilesByEmail = {};
            usersProfileSnapshot.docs.forEach(element => {
                const userProfileData = element.data();
                if(userProfileData.email){
                    userProfilesByEmail[userProfileData.email.toLowerCase()] = userProfileData;
                }
            });

            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Get userId from document ID (not from data field)
                const userId = doc.id;
                
                console.log('Users: Processing userId:', userId, 'from doc.id');
                
                // Join by userId (matches Users doc ID)
                let userProfile = userProfiles[userId];
                
                if(userProfile){
                    console.log('Users: Found matching profile for userId', userId);
                } else {
                    console.log('Users: No match for userId', userId, '- trying email fallback');
                }
                
                // Fallback to join by email
                if(!userProfile && userData.email){
                    userProfile = userProfilesByEmail[userData.email.toLowerCase()];
                    if(userProfile){
                        console.log('Users: Used email fallback for', userData.email);
                    }
                }

                userProfile = userProfile || {};
                const genderLabel = userProfile.gender || userData.gender || 'N/A';
                userListHTML += `<tr>
                    <td>${userData.name || 'N/A'}</td>
                    <td>${userProfile.username || 'N/A'}</td>
                    <td>${genderLabel}</td>
                    <td>${userProfile.email || 'N/A'}</td>
                    <td style="text-align: center;">
                        <button type="button" class="edit-btn" onclick="showEditUserForm('${doc.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>`;
            });
            userListHTML += '</tbody></table>';
            console.log('Users: final HTML length', userListHTML.length);
            console.log('Users: HTML preview:', userListHTML.substring(0, 200));
            console.log('Users: totalUsers element exists?', !!totalUsers);
            if(totalUsers){
                totalUsers.innerHTML = userListHTML;
                console.log('Users: HTML rendered to page');
                console.log('Users: element innerHTML after render:', totalUsers.innerHTML.substring(0, 100));
            } else {
                console.log('Users: ERROR - totalUsers element not found');
            }
        } else {
            console.log('Users: no matching data to display.');
            userListHTML += '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #64748b;">No users found</td></tr></tbody></table>';
            if(totalUsers){
                totalUsers.innerHTML = userListHTML;
            }
        }
    }catch(error){
        console.error('Error loading users:', error);
    }
}

checkAuthState();

//show edit form with user details
function showEditUserForm(userId){
    const adminMain = document.getElementById('admin-main');
    const editUserPopup = document.getElementById('edit-user-popup');
    const updateButton = document.querySelector('.edit-user-content .update-btn');
    
    // Clear form fields first
    if(editUserNameInput) editUserNameInput.value = '';
    if(editUserUsernameInput) editUserUsernameInput.value = '';
    if(editUserGenderInput) editUserGenderInput.value = '';
    if(editUserEmailInput) editUserEmailInput.value = '';
    
    // Disable update button until data loads
    if(updateButton){
        updateButton.disabled = true;
        updateButton.textContent = 'Loading...';
    }
    
    if(editUserPopup){
        editUserPopup.style.display = 'flex';
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }
        document.body.style.overflow = 'hidden';
    }

    if(userId){
        currentEditUserId = userId;
        // Wait for data to load before enabling the button
        editUserDetails(userId).then(() => {
            if(updateButton){
                updateButton.disabled = false;
                updateButton.textContent = 'Update';
            }
        }).catch((error) => {
            console.error('Error loading user details:', error);
            if(updateButton){
                updateButton.disabled = false;
                updateButton.textContent = 'Update';
            }
        });
    }

}

function closeEditUserPopup(){
    const adminMain = document.getElementById('admin-main');
    const editUserPopup = document.getElementById('edit-user-popup');
    if(editUserPopup){
        editUserPopup.style.display = 'none';
    }
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
}

function showUpdateSuccessMessage(){
    const updateSuccessMessage = document.getElementById('update-success-message');
    if(updateSuccessMessage){
        updateSuccessMessage.style.display = 'flex';
        const adminMain = document.getElementById('admin-main');
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }  
        document.body.style.overflow = 'hidden';
    }
    
}

function closeUpdateSuccessMessage(){
    const updateSuccessMessage = document.getElementById('update-success-message');
    if(updateSuccessMessage){
        updateSuccessMessage.style.display = 'none';
    }
    const adminMain = document.getElementById('admin-main');
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
}

//update user details from edit form
async function updateProfile(){
    console.log('=== updateProfile() CALLED ===');
    const updateButton = document.querySelector('.edit-user-content .update-btn');

    if(isUserUpdateInProgress){
        console.log('Update blocked: request already in progress');
        return;
    }

    const now = Date.now();
    if(now - lastUserUpdateAttemptAt < USER_UPDATE_COOLDOWN_MS){
        console.log('Update blocked: cooldown active');
        return;
    }

    isUserUpdateInProgress = true;
    lastUserUpdateAttemptAt = now;
    if(updateButton){
        updateButton.disabled = true;
        updateButton.textContent = 'Updating...';
    }
    
    try{
        console.log('1. Checking currentEditUserId:', currentEditUserId);
        if(!currentEditUserId){
            alert('Error: No user selected for update.');
            return;
        }

        // Validate inputs exist
        console.log('2. Checking form field elements...');
        if(!editUserNameInput || !editUserUsernameInput){
            alert('Error: Form fields not found');
            console.error('Missing form inputs:', {editUserNameInput, editUserUsernameInput});
            return;
        }
        console.log('3. Form fields found ✓');

        const nameValue = editUserNameInput.value.trim();
        const usernameValue = editUserUsernameInput.value.trim();
        const genderValue = editUserGenderInput.value;
        const emailValue = editUserEmailInput.value.trim();
        
        console.log('4. Form values:', {
            name: nameValue,
            nameLength: nameValue.length,
            username: usernameValue,
            usernameLength: usernameValue.length,
            gender: genderValue,
            email: emailValue
        });

        // user name validation
        console.log('5. Validating user name...');
        if(!nameValue || nameValue.length === 0){
            alert('User name cannot be empty.');
            editUserNameInput.focus();
            return;
        }
        
        if(nameValue.length < 3){
            alert('User name must be at least 3 characters long.');
            editUserNameInput.focus();
            return;
        }

        if(nameValue.length > 150){
            alert('User name must be less than 150 characters long.');
            editUserNameInput.focus();
            return;
        }
        console.log('6. User name validation passed ✓');

        // username validation
        console.log('7. Validating username...');
        if(!usernameValue || usernameValue.length === 0){
            alert('Username cannot be empty.');
            editUserUsernameInput.focus();
            return;
        }
        
        if(usernameValue.length < 3){
            alert('Username must be at least 3 characters long.');
            editUserUsernameInput.focus();
            return;
        }

        if(usernameValue.length > 150){
            alert('Username must be less than 150 characters long.');
            editUserUsernameInput.focus();
            return;
        }
        console.log('8. Username validation passed ✓')

        // gender validation
        console.log('10.5. Validating gender...');
        if(!genderValue || genderValue.length === 0){
            alert('Gender must be selected.');
            editUserGenderInput.focus();
            return;
        }
        console.log('10.6. Gender validation passed ✓');

        // email validation
        console.log('10.7. Validating email...');
        if(!emailValue || emailValue.length === 0){
            alert('Email cannot be empty.');
            editUserEmailInput.focus();
            return;
        }
        console.log('10.8. Email validation passed ✓');

        console.log('✓ ALL VALIDATIONS PASSED');
        console.log('11. Updating user with ID:', currentEditUserId);

        const userDocRef = db.collection('Users').doc(currentEditUserId);
        const userDoc = await userDocRef.get();
        if(!userDoc.exists){
            console.error('User doc not found for update:', currentEditUserId);
            alert('Error: User not found in database');
            return;
        }

        const updatedUserData = {
            username: usernameValue,
            name: nameValue,
            gender: genderValue,
            email: emailValue,
        };
        
        console.log('Updating Users collection with:', updatedUserData);
        await userDocRef.update(updatedUserData);
        console.log('✓ Users collection updated successfully');
        
        closeEditUserPopup();
        showUpdateSuccessMessage();
        
        // Reload the user list after a short delay
        setTimeout(() => {
            console.log('Reloading user list...');
            loadUsers();
        }, 500);
    }
    catch(error){
        console.error('ERROR in updateProfile():', error);
        console.error('Error stack:', error.stack);
        alert('Error: ' + error.message);
    } finally {
        isUserUpdateInProgress = false;
        if(updateButton){
            updateButton.disabled = false;
            updateButton.textContent = 'Update';
        }
    }
}

//edit specific user details show in edit form like a pop up form 
async function editUserDetails(userId){
    try{
        const userDoc = await db.collection('Users').doc(userId).get();
        if(!userDoc.exists){
            console.error('User doc not found for edit:', userId);
            return Promise.reject(new Error('User not found'));
        }

        const userData = userDoc.data();
        if(editUserNameInput){
            editUserNameInput.value = userData.name || '';
        }
        if(editUserUsernameInput){
            editUserUsernameInput.value = userData.username || '';
        }
        if(editUserGenderInput){
            editUserGenderInput.value = userData.gender || '';
        }
        if(editUserEmailInput){
            editUserEmailInput.value = userData.email || '';
        }

        console.log('User details loaded successfully for:', userId);
        return Promise.resolve();
    }catch(error){
        console.error('Error fetching user details for edit:', error);
        return Promise.reject(error);
    }
}

//show add user pop up 
function showAddUserPopup(){
    const adminMain = document.getElementById('admin-main');
    const userPopup = document.getElementById('add-user-popup');

    if(userPopup){
        userPopup.style.display = 'flex';
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }
        document.body.style.overflow = 'hidden';
    }
}

// Toggle doctor-specific fields based on role selection
function toggleDoctorFields(){
    const roleSelect = document.getElementById('add-user-role');
    const specializationField = document.getElementById('specialization-field');
    const roomField = document.getElementById('room-field');
    const specializationInput = document.getElementById('add-user-specialization');
    
    if(roleSelect.value === 'doctor'){
        specializationField.style.display = 'block';
        roomField.style.display = 'block';
        specializationInput.required = true;
    } else {
        specializationField.style.display = 'none';
        roomField.style.display = 'none';
        specializationInput.required = false;
    }
}

// cancel add user pop up
function closeAddUserPopup(){
    const adminMain = document.getElementById('admin-main');
    const userPopup = document.getElementById('add-user-popup');

    if(userPopup){
        userPopup.style.display = 'none';
    }
    if(adminMain){
        adminMain.style.filter = 'none';
    }
    document.body.style.overflow = 'auto';
    
    // Reset form
    const form = userPopup.querySelector('form');
    if(form){
        form.reset();
    }
    // Hide doctor fields
    toggleDoctorFields();
}

//add new user
async function addNewUser(){
    try{
        const nameInput = document.getElementById('add-user-name');
        const usernameInput = document.getElementById('add-user-username');
        const descriptionInput = document.getElementById('add-user-description');
        const roleInput = document.getElementById('add-user-role');
        const genderInput = document.getElementById('add-user-gender');
        const phoneNumberInput = document.getElementById('add-user-phone');
        const emailInput = document.getElementById('add-user-email');
        const passwordInput = document.getElementById('add-user-password');
        
        // Doctor-specific fields
        const specializationInput = document.getElementById('add-user-specialization');
        const roomInput = document.getElementById('add-user-room');

        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const description = descriptionInput.value.trim();
        const role = roleInput.value;
        const gender = genderInput.value;
        const phoneNumber = phoneNumberInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate required fields
        if(!name || !username || !role || !gender || !email || !password){
            alert('Please fill in all required fields.');
            return;
        }

        // If role is doctor, validate specialization
        if(role === 'doctor' && !specializationInput.value.trim()){
            alert('Specialization is required for doctors.');
            specializationInput.focus();
            return;
        }

        if(!auth.currentUser){
            throw new Error('No user logged in.');
        }

        console.log('Getting ID token for user:', auth.currentUser.uid);
        const idToken = await auth.currentUser.getIdToken();
        console.log('ID token obtained, length:', idToken.length);
        
        // Prepare payload
        const payload = {
            name,
            username,
            description,
            role,
            gender,
            phoneNumber,
            email,
            password
        };

        // Add doctor-specific fields if role is doctor
        if(role === 'doctor'){
            payload.specialization = specializationInput.value.trim();
            payload.room = roomInput.value.trim();
        }

        console.log('Sending payload:', { ...payload, password: '[HIDDEN]' });
        
        const response = await fetch('http://localhost:3000/api/admin/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        
        // Check if response has content before parsing JSON
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let result;
        if(responseText){
            try{
                result = JSON.parse(responseText);
            }catch(e){
                throw new Error('Server returned invalid response: ' + responseText);
            }
        }else{
            throw new Error('Server returned empty response');
        }
        
        console.log('Server response:', result);
        
        if(!response.ok){
            throw new Error(result.error || 'Failed to create user');
        }
        
        console.log('User created successfully with role:', result.role);
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!`);
        closeAddUserPopup();
        loadUsers();

    } catch(error){
        console.error('Error adding new user:', error);
        alert('Error: ' + error.message);
    }
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

function initAddUserGenderSelect(){
    if(!addUserGenderSelect){
        return;
    }

    const removePlaceholder = () => {
        const placeholder = addUserGenderSelect.querySelector('option[value=""]');
        if(placeholder){
            placeholder.remove();
        }
    };

    addUserGenderSelect.addEventListener('change', () => {
        if(addUserGenderSelect.value){
            removePlaceholder();
        }
    });
}

function initEditUserPopupBackdropClose(){
    const editUserPopup = document.getElementById('edit-user-popup');
    if(!editUserPopup){
        return;
    }

    editUserPopup.addEventListener('click', (event) => {
        // Close only when clicking the backdrop, not the popup content.
        if(event.target === editUserPopup){
            closeEditUserPopup();
        }
    });
}

function initAddUserPopupBackdropClose(){
    const addUserPopup = document.getElementById('add-user-popup');
    if(!addUserPopup){
        return;
    }

    addUserPopup.addEventListener('click', (event) => {
        // Close only when clicking the backdrop, not the popup content.
        if(event.target === addUserPopup){
            closeAddUserPopup();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    initAddUserGenderSelect();
    initEditUserPopupBackdropClose();
    initAddUserPopupBackdropClose();
});