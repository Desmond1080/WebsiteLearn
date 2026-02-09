// DOM Elements 
//use for authentication and app sections 
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');

// forms 
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const termsAndConditionsForm = document.getElementById('terms-and-conditions-form');

let selectedRole = 'user'; // default role

// role selection function 
function selectRole(role){
    selectedRole = role;
    //update button
    document.getElementById('user-role-button').classList.remove('active');
    document.getElementById('doctor-role-button').classList.remove('active');
    document.getElementById('admin-role-button').classList.remove('active');
    if(role === 'user'){
        document.getElementById('user-role-button').classList.add('active');
    } else if(role === 'doctor'){
        document.getElementById('doctor-role-button').classList.add('active');
    } else if (role === 'admin'){
        document.getElementById('admin-role-button').classList.add('active');
    }
}

// Role helper functions
function getUserRole() {
    return localStorage.getItem('userRole') || 'user';
}

function isAdmin() {
    return getUserRole() === 'admin';
}

function isDoctor() {
    return getUserRole() === 'doctor';
}

function isUser() {
    return getUserRole() === 'user';
}

// Check access for protected pages
function checkAdminAccess(){
    if(!isAdmin()){
        alert('Unauthorized access. Admin role required.');
        window.location.href = '../User/UserLoginAndRegister.html';
        return false;
    }
    return true;
}

function checkDoctorAccess(){
    if(!isDoctor()){
        alert('Unauthorized access. Doctor role required.');
        window.location.href = '../User/UserLoginAndRegister.html';
        return false;
    }
    return true;
}

// authentication function 
function showRegister(){
    authSection.style.display = 'block'; // show auth section
    forgotPasswordForm.style.display = 'none'; // hide forgot password section
    loginForm.style.display = 'none'; // hide login form 
    registerForm.style.display = 'block'; // show register form
    termsAndConditionsForm.style.display = 'none'; // hide terms and conditions form
    clearErrors();
}

function showLogin(){
    authSection.style.display = 'block'; // show auth section
    forgotPasswordForm.style.display = 'none'; // hide forgot password section
    loginForm.style.display = 'block'; // show login form
    registerForm.style.display = 'none'; // hide register form
    appSection.style.display = 'none'; // hide app section
    termsAndConditionsForm.style.display = 'none'; // hide terms and conditions form
    clearErrors();
}

function showForgotPassword(){
    forgotPasswordForm.style.display = 'block'; // show forgot password form
    loginForm.style.display = 'none'; // hide login form
    registerForm.style.display = 'none'; // hide register form
    authSection.style.display = 'block'; // show auth section
    termsAndConditionsForm.style.display = 'none'; // hide terms and conditions form
    clearErrors();
}

function clearErrors(){
    document.getElementById('login-error').innerText = '';
    document.getElementById('register-error').innerText = '';
    document.getElementById('forgot-password-error').innerText = '';
}

//show terms and conditions form 
function showTermsAndConditions(){
    termsAndConditionsForm.style.display = 'block'; // show terms and conditions form
    forgotPasswordForm.style.display = 'none'; // hide forgot password section
    loginForm.style.display = 'none'; // hide login form
    registerForm.style.display = 'none'; // hide register form
    authSection.style.display = 'block'; // hide auth section
}

//toggle password able to see or hide 
function togglePasswordVisibility(inputId ){
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('img');
    
    if(input.type === "password"){
        input.type = "text";
        icon.src = "../image/hidden.png";
    } else{
        input.type = "password";
        icon.src = "../image/eye.png";
    }
}

//login functions
async function login(){
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value;
    const password = passwordInput.value;
    const errorMsg = document.getElementById('login-error');

    // Clear previous errors
    emailInput.style.border = '';
    passwordInput.style.border = '';
    errorMsg.innerText = '';

    try{
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const userDoc = await db.collection("Users").doc(userCredential.user.uid).get();
        const userRole = userDoc.data().role; 

        if(userRole != selectedRole){
            errorMsg.innerText = `Please log in with the correct ${userRole} account.`;
            return;
        }

        console.log('User logged in:', userCredential.user);
        errorMsg.innerText = ""; // Clear error on success

        localStorage.setItem('userRole', userRole); // store role in local storage
        loadUserData();
    } catch (firebaseError){
        // Handle Firebase errors
        if(firebaseError.code === 'auth/user-not-found'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Email not found. Please register first.";
        } else if(firebaseError.code === 'auth/wrong-password'){
            passwordInput.style.border = '2px solid red';
            errorMsg.innerText = "Password is incorrect.";
        } else if(firebaseError.code === 'auth/invalid-email'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Invalid email format.";
        } else {
            errorMsg.innerText = firebaseError.message;
        }
        console.error('Login error:', firebaseError);
    }
}

// login with Google function
async function loginWithGoogle(){
    try{
        const provider = new firebase.auth.GoogleAuthProvider();

        // sign in with popup
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // check if user exists in firestore
        const userDoc = await db.collection("Users").doc(user.uid).get();
        if(!userDoc.exists){
            // if not, create new user document
            await db.collection("Users").doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        loadUserData();
    } catch(error){
        console.error('Google login error:', error);
        alert('Error during Google login: ' + error.message);
    }
}


//register function
async function register(){
    const nameInput = document.getElementById('register-name');
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const phoneInput = document.getElementById('register-phone');
    const genderInput = document.getElementById('register-gender');
    const descriptionInput = document.getElementById('register-description');
    const name = nameInput.value;
    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const phoneNumber = phoneInput.value;
    const gender = genderInput.value;
    const description = descriptionInput.value;
    const errorMsg = document.getElementById('register-error');

    // Clear previous errors
    nameInput.style.border = '';
    usernameInput.style.border = '';
    emailInput.style.border = '';
    passwordInput.style.border = '';
    errorMsg.innerText = '';
    phoneInput.style.border = '';
    genderInput.style.border = '';
    descriptionInput.style.border = '';

    try{
        // create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // convert to firestore user
        const user = userCredential.user;

        // save user data to firestore 
        await db.collection("Users").doc(user.uid).set({
            name: name,
            username: username,
            email: email,
            phoneNumber: phoneNumber,
            imageUrl: '',
            gender: gender,
            description: description,
            role: selectedRole,  // Use selected role from dropdown
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // log user info by tracking 
        console.log('User registered:', user);
        errorMsg.innerText = "Registration successful! Logging you in...";
        showLogin();

    } catch(firebaseError){
        // Handle Firebase errors
        if(firebaseError.code === 'auth/email-already-in-use'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Email already registered. Try logging in.";
        } else if(firebaseError.code === 'auth/invalid-email'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Invalid email format.";
        } else if(firebaseError.code === 'auth/weak-password'){
            passwordInput.style.border = '2px solid red';
            errorMsg.innerText = "Password is too weak. Use at least 6 characters.";
        } else {
            errorMsg.innerText = firebaseError.message;
        }
        console.error('Register error:', firebaseError);
    }
}

// logout function
async function logout(){
    if(confirm('Are you sure you want to log out?')){
        // proceed with logout
        // sign out user
        await auth.signOut();
        // show auth section and hide app section
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        console.log('User logged out');
    } else {
        // cancel logout
        console.log('Logout cancelled');
        return;
    }
}

// load user data function
async function loadUserData(){
    const user = auth.currentUser;

    if(user){
        const userDocument = await db.collection("Users").doc(user.uid).get();
        const userData = userDocument.data();
        const userRole = userData?.role || 'user';

        // Store role in localStorage
        localStorage.setItem('userRole', userRole);

        // Route based on role
        if(userRole === 'admin'){
            window.location.href = '../Admin/AdminDashboard.html';
        } else if(userRole === 'doctor'){
            window.location.href = '../Doctor/DoctorDashboard.html';
        } else {
            // user role - show normal app
            document.getElementById('user-name').textContent = userData?.name || user.email;
            authSection.style.display = 'none';
            appSection.style.display = 'block'; // show app section 
            console.log('User data loaded:', userData);
            
            // Load user's notes
            fetchNotes();
        }
    } else{
        authSection.style.display = 'block';
        appSection.style.display = 'none';
    }

}

//load user profile data on page load
async function loadProfileData(){
    const user = auth.currentUser;
    if(user){
        try{
            const userDocument = await db.collection("Users").doc(user.uid).get();
            const userData = userDocument.data();

            document.getElementById('change-password-section').style.display = 'none';
            document.getElementById('notes-section').style.display = 'none';
            
            // Display user data
            loadProfilePicture();
            if(document.getElementById('display-name')){
                document.getElementById('display-name').textContent = userData?.name || 'Not set';
            }
            if(document.getElementById('display-email')){
                document.getElementById('display-email').textContent = user.email;
            }
            
            // Populate edit form inputs
            if(document.getElementById('profile-name')){
                document.getElementById('profile-name').value = userData?.name || '';
            }
            if(document.getElementById('profile-username')){
                document.getElementById('profile-username').value = userData?.username || '';
            }
            if(document.getElementById('profile-phone')){
                document.getElementById('profile-phone').value = userData?.phoneNumber || '';
            }
            if(document.getElementById('profile-description')){
                document.getElementById('profile-description').value = userData?.description || '';
            }
            if(document.getElementById('profile-email')){
                document.getElementById('profile-email').value = user.email;
            }
        } catch(error){
            console.error('Error loading profile data:', error);
        }
    } else {
        console.log('No user logged in, waiting for auth...');
    }
}

// Show edit profile form
function showEditProfile(){
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('edit-profile-section').style.display = 'block';
    document.getElementById('change-password-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'none';
}

//show change password form
function changePassword(){
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'block';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'none';
}

//show notes form 
function viewNotes(){
    document.getElementById('notes-section').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'none';
    fetchNotes();   
}

//hide notes form
function cancelViewNotes(){
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'flex';
}

//hide change password form
function cancelChangePassword(){
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('change-password-section').style.display = 'none';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'flex';
}

// Hide edit profile form
function cancelEdit(){
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-options').style.display = 'flex';
}

// show edit note section
let currentEditNoteId = null;

function showEditNote(noteId, noteContent = ''){
    if(noteId){
        currentEditNoteId = noteId;
    }
    const editNoteContent = document.getElementById('edit-note-content');
    if(editNoteContent){
        editNoteContent.value = noteContent;
    }
    document.getElementById('edit-note-section').style.display = 'block'; // show edit note section
    document.getElementById('app-section').style.display = 'none'; // hide app section
}


//update user password 
async function changeNewPassword(){
    const user = auth.currentUser;
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password'); 
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const errorMsg = document.getElementById('change-password-error');

    // Clear previous errors
    currentPasswordInput.style.border = '';
    newPasswordInput.style.border = '';
    errorMsg.innerText = '';

    // Validate inputs
    if(!currentPassword || !newPassword){
        errorMsg.innerText = 'Please fill in all fields';
        return;
    }  

    if(newPassword.length < 6){
        newPasswordInput.style.border = '2px solid red';
        errorMsg.innerText = 'New password must be at least 6 characters long';
        return;
    }

    if(currentPassword === newPassword){
        errorMsg.innerText = 'New password must be different from current password';
        return;
    }

    if(user){
        try{
            // Reauthenticate user with current password
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            
            // Reauthenticate user
            await user.reauthenticateWithCredential(credential);

            // Update password in Firebase Auth
            await user.updatePassword(newPassword);

            // Show success message
            errorMsg.innerText = 'Password updated successfully!';
            errorMsg.style.color = 'green';

            // Clear inputs and close form after success
            setTimeout(() => {
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                cancelChangePassword();
                errorMsg.innerText = '';
                errorMsg.style.color = '';
            }, 2000);

        } catch(error){
            console.error('Password update error:', error);
            errorMsg.style.color = 'red';
            
            // Handle specific errors
            if(error.code === 'auth/wrong-password'){
                currentPasswordInput.style.border = '2px solid red';
                errorMsg.innerText = 'Current password is incorrect';
            } else if(error.code === 'auth/weak-password'){
                newPasswordInput.style.border = '2px solid red';
                errorMsg.innerText = 'New password is too weak';
            } else if(error.code === 'auth/requires-recent-login'){
                errorMsg.innerText = 'Please log out and log in again to change password';
            } else {
                errorMsg.innerText = error.message;
            }
        }
    }
}

// Update user profile
async function updateProfile(){
    const user = auth.currentUser;
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const usernameInput = document.getElementById('profile-username');
    const phoneInput = document.getElementById('profile-phone');
    const descriptionInput = document.getElementById('profile-description');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const phoneNumber = phoneInput.value.trim();
    const description = descriptionInput.value.trim();
    const errorMsg = document.getElementById('profile-error');

    // Clear previous errors
    nameInput.style.border = '';
    emailInput.style.border = '';  
    usernameInput.style.border = '';
    phoneInput.style.border = '';
    descriptionInput.style.border = '';
    errorMsg.innerText = '';

    if(!name || !email){
        errorMsg.innerText = 'Please fill in all fields';
        return;
    }

    if(user){
        try{
            // Update email in Firebase Auth
            if(email !== user.email){
                await user.updateEmail(email);
            }

            // Update name and email in Firestore
            await db.collection("Users").doc(user.uid).update({
                name: name,
                username: username,
                phoneNumber: phoneNumber,
                description: description,
                email: email,
            });
            
            errorMsg.innerText = 'Profile updated successfully!';
            errorMsg.style.color = 'green';
            
            // Refresh profile display
            setTimeout(() => {
                loadProfileData();
                cancelEdit();
            }, 1500);
        } catch(error){
            console.error('Profile update error:', error);
            errorMsg.innerText = error.message;
            errorMsg.style.color = 'red';
        }
    }
}

// reset password function
async function resetPassword(){
    const emailInput = document.getElementById('forgot-password-email');
    const email = emailInput.value;
    const errorMsg = document.getElementById('forgot-password-error');

    // Clear previous errors
    emailInput.style.border = '';
    errorMsg.innerText = '';

    try{
        await auth.sendPasswordResetEmail(email);
        errorMsg.innerText = "Reset email sent! Check your inbox.";
        errorMsg.style.color = 'green';
        setTimeout(() => showLogin(), 2000); // Go back to login after 2 seconds
    } catch(firebaseError){
        errorMsg.style.color = '';
        // Handle Firebase errors
        if(firebaseError.code === 'auth/user-not-found'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Email not found. Please register first.";
        } else if(firebaseError.code === 'auth/invalid-email'){
            emailInput.style.border = '2px solid red';
            errorMsg.innerText = "Invalid email format.";
        } else {
            errorMsg.innerText = firebaseError.message;
        }
        console.error('Reset password error:', firebaseError);
    }
}

// add note function 
async function addNote(){
    const noteInput = document.getElementById('note-content');
    const content = noteInput.value;
    const user = auth.currentUser;

    if(user){
        const userDocument = await db.collection("Users").doc(user.uid).get();
        const userData = userDocument.data();

        if(content.trim() === ''){
            // call pop up card 
            document.getElementById('save-note-popout').style.display = 'block';
            document.getElementById('app-section').style.filter = 'blur(5px)';
            return;
        }

        try{
            const noteRef = db.collection("note").doc();
            await noteRef.set({
                userId: user.uid,
                userName: userData?.name,
                content: content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            noteInput.value = ''; // Clear input field
        } catch(error){
            console.error('Error adding note:', error);
        }
    }
}

function closeSaveNotePopout(){
    document.getElementById('save-note-popout').style.display = 'none';
    document.getElementById('app-section').style.filter = 'none';
}

//fetch all notes and show as list of the notes 
async function fetchNotes(){
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = ''; // Clear existing notes
    const user = auth.currentUser;

    if(user){
        try{
            const notesSnapshot = await db.collection("note").where("userId", "==", user.uid).get();
            notesSnapshot.forEach((doc) => {
                // create note element
                // create list item for notes
                const noteData = doc.data();
                const noteElement = document.createElement('div');
                noteElement.className = 'note-list';

                const list = document.createElement('ul');
                const listItem = document.createElement('li');
                listItem.textContent = noteData.content;

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'edit-note-button';
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => showEditNote(doc.id, noteData.content));

                listItem.appendChild(editButton);
                list.appendChild(listItem);
                noteElement.appendChild(list);
                notesContainer.appendChild(noteElement);
            });
        } catch(error){
            console.error('Error fetching notes:', error);
        }
    } 
}

//edit note function
async function editNotes(noteId, newNote){
    try{
        await db.collection("note").doc(noteId).update({
            content: newNote
        });

        console.log('Note updated:', noteId);
        fetchNotes(); // Refresh notes list
    }catch(error){
        console.error('Error updating note:', error);
    }
}

// delete note function
async function deleteNote(noteId){
    try{
        await db.collection("note").doc(noteId).delete();
        console.log('Note deleted:', noteId);
        fetchNotes(); // Refresh notes list
    } catch(error){
        console.error('Error deleting note:', error);
    }
}



// Firebase auth state observer
console.log('App.js loaded successfully!');
console.log('Auth section:', authSection);

auth.onAuthStateChanged((user) => {
    console.log('Auth state changed. User:', user);
    if(user){
        // User is logged in
        // Check if we're on the profile page or main app page
        if(document.getElementById('display-name')){
            // We're on the profile page
            loadProfileData();
        } else if(authSection && appSection){
            // We're on the main app page
            loadUserData();
        }
    } else {
        // User is not logged in - show auth section
        if(authSection && appSection){
            authSection.style.display = 'block';
            appSection.style.display = 'none';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            forgotPasswordForm.style.display = 'none';
            termsAndConditionsForm.style.display = 'none';
            console.log('Showing login form');
        } else {
            // On profile page without login, redirect to main page
            window.location.href = 'UserLoginAndRegister.html';
        }
    }
});


const MENU_WIDTH = "220px";

function setMenuState(isOpen){
    const side = document.getElementById("side-menu-bar");
    const app = document.getElementById("app-section");
    const toggleBtn = document.querySelector(".open-menu-bar-button");
    if(!side || !app || !toggleBtn) return;

    side.classList.toggle("is-open", isOpen);
    app.classList.toggle("menu-open", isOpen);
    toggleBtn.classList.toggle("menu-open", isOpen);
}

function openMenuBar(){
    setMenuState(true);
}

function closeMenuBar(){
    setMenuState(false);
}

function toggleMenuBar(){
    const side = document.getElementById("side-menu-bar");
    const isOpen = side?.classList.contains("is-open");
    setMenuState(!isOpen);
}


async function uploadFile(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('File uploaded:', data.mediaId);
      return data.mediaId;
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
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
        const profiePictureRef = storageRef.child(`profile_pictures/${user.uid}/${file.name}`);

        //upload file
        await profiePictureRef.put(file);

        // Get download URL
        const downloadURL = await profiePictureRef.getDownloadURL();

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

function searchNotes(){
    const input = document.getElementById('search-note-input');
    const filter = input.value.toLowerCase();

    const notesContainer = document.getElementById('notes-container');
    const notes = notesContainer.getElementsByClassName('note-list');

    for(let i =0; i < notes.length; i++){
        if(notes[i].innerText.toLowerCase().includes(filter)){
            notes[i].style.display = '';
        } else {
            notes[i].style.display = 'none';
        }
    }
}