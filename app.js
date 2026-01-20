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
        icon.src = "image/hidden.png";
    } else{
        input.type = "password";
        icon.src = "image/eye.png";
    }
}

//login functions
async function login(){
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const error = document.getElementById('login-error');

    // Validation - Check empty fields
    if(!email){
        error.innerText = "Email cannot be empty.";
        return;
    }
    if(!password){
        error.innerText = "Password cannot be empty.";
        return;
    }

    try{
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user);
        error.innerText = ""; // Clear error on success
        loadUserData();
    } catch (error){
        // Handle Firebase errors
        if(error.code === 'auth/user-not-found'){
            error.innerText = "Email not found. Please register first.";
        } else if(error.code === 'auth/wrong-password'){
            error.innerText = "Password is incorrect.";
        } else if(error.code === 'auth/invalid-email'){
            error.innerText = "Invalid email format.";
        } else {
            error.innerText = error.message;
        }
    }
}


//register function
async function register(){
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const error = document.getElementById('register-error');

    // Validation - Check empty fields
    if(!name){
        error.innerText = "Full Name cannot be empty.";
        return;
    }
    if(!email){
        error.innerText = "Email cannot be empty.";
        return;
    }
    if(!password){
        error.innerText = "Password cannot be empty.";
        return;
    }
    if(password.length < 6){
        error.innerText = "Password must be at least 6 characters.";
        return;
    }

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
        error.innerText = "Registration successful! Logging you in...";
        // load user data
        loadUserData();

    } catch(error){
        // Handle Firebase errors
        if(error.code === 'auth/email-already-in-use'){
            error.innerText = "Email already registered. Try logging in.";
        } else if(error.code === 'auth/invalid-email'){
            error.innerText = "Invalid email format.";
        } else if(error.code === 'auth/weak-password'){
            error.innerText = "Password is too weak. Use at least 6 characters.";
        } else {
            error.innerText = error.message;
        }
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
        appSection.style.display = 'block';
        console.log('User data loaded:', userData); 

    } else{
        authSection.style.display = 'block';
        appSection.style.display = 'none';
    }

}

// reset password function
async function resetPassword(){
    const email = document.getElementById('forgot-password-email').value;
    const error = document.getElementById('forgot-password-error');

    if(!email){
        error.innerText = "Email cannot be empty.";
        return;
    }

    try{
        await auth.sendPasswordResetEmail(email);
        error.innerText = "Reset email sent! Check your inbox.";
        setTimeout(() => showLogin(), 2000); // Go back to login after 2 seconds
    } catch(err){
        // Handle Firebase errors
        if(err.code === 'auth/user-not-found'){
            error.innerText = "Email not found. Please register first.";
        } else if(err.code === 'auth/invalid-email'){
            error.innerText = "Invalid email format.";
        } else {
            error.innerText = err.message;
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