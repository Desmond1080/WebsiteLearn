// DOM Elements 
//use for authentication and app sections 
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');

// forms 
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// authentication function 
function showRegister(){
    authSection.style.display = 'block'; // show auth section
    forgotPasswordForm.style.display = 'none'; // hide forgot password section
    loginForm.style.display = 'none'; // hide login form 
    registerForm.style.display = 'block'; // show register form
    clearErrors();
}

function showLogin(){
    authSection.style.display = 'block'; // show auth section
    forgotPasswordForm.style.display = 'none'; // hide forgot password section
    loginForm.style.display = 'block'; // show login form
    registerForm.style.display = 'none'; // hide register form
    appSection.style.display = 'none'; // hide app section
    clearErrors();
}

function showForgotPassword(){
    forgotPasswordForm.style.display = 'block'; // show forgot password form
    loginForm.style.display = 'none'; // hide login form
    registerForm.style.display = 'none'; // hide register form
    authSection.style.display = 'block'; // show auth section
    clearErrors();
}

function clearErrors(){
    document.getElementById('login-error').innerText = '';
    document.getElementById('register-error').innerText = '';
    document.getElementById('forgot-password-error').innerText = '';
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
        console.log('User logged in:', userCredential.user);
        errorMsg.innerText = ""; // Clear error on success
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


//register function
async function register(){
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const errorMsg = document.getElementById('register-error');

    // Clear previous errors
    nameInput.style.border = '';
    emailInput.style.border = '';
    passwordInput.style.border = '';
    errorMsg.innerText = '';

    try{
        // create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // convert to firestore user
        const user = userCredential.user;

        // save user data to firestore 
        await db.collection("Users").doc(user.uid).set({
            name: name,
            email: email,
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

        // display user data in app section
        document.getElementById('user-name').textContent = userData?.name || user.email;
        authSection.style.display = 'none';
        appSection.style.display = 'block'; // show app section 
        console.log('User data loaded:', userData);
        
        // Load user's notes
        fetchNotes(); 

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
}

//show change password form
function changePassword(){
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'block';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('notes-section').style.display = 'none';
}

//show notes form 
function viewNotes(){
    document.getElementById('notes-section').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('edit-profile-section').style.display = 'none';
    document.getElementById('change-password-section').style.display = 'none';
    fetchNotes();   
}

//hide notes form
function cancelViewNotes(){
    document.getElementById('notes-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
}

//hide change password form
function cancelChangePassword(){
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('change-password-section').style.display = 'none';
}

// Hide edit profile form
function cancelEdit(){
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('edit-profile-section').style.display = 'none';
}

//view Notes function
async function viewAllNotes(){

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
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const errorMsg = document.getElementById('profile-error');

    // Clear previous errors
    nameInput.style.border = '';
    emailInput.style.border = '';  
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
            alert('Note content cannot be empty.');
            return;
        }

        try{
            await db.collection("note").doc(noteInput.uid).set({
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
                noteElement.innerText = noteData.content;
                notesContainer.appendChild(noteElement);
            });
        } catch(error){
            console.error('Error fetching notes:', error);
        }
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
            console.log('Showing login form');
        } else {
            // On profile page without login, redirect to main page
            window.location.href = 'UserLoginAndRegister.html';
        }
    }
});
