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
    // sign out user
    await auth.signOut();
    // show auth section and hide app section
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    console.log('User logged out');
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
        try{
            await db.collection("note").doc(noteInput.uid).set({
                userId: user.uid,
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


// Firebase auth state observer
console.log('App.js loaded successfully!');
console.log('Auth section:', authSection);

auth.onAuthStateChanged((user) => {
    console.log('Auth state changed. User:', user);
    if(user){
        // User is logged in - show app section
        loadUserData();
    } else {
        // User is not logged in - show auth section
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        forgotPasswordForm.style.display = 'none';
        console.log('Showing login form');
    }
});
