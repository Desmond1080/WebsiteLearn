// DOM Elements //use for authentication and app sections 
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// authentication function 
function showRegister(){
    loginForm.style.display = 'none'; // hide login form 
    registerForm.style.display = 'block'; // show register form
    forgotPasswordForm.style.display = 'none'; // hide forgot password form
    clearErrors();
}

function showLogin(){
    loginForm.style.display = 'block'; // show login form
    registerForm.style.display = 'none'; // hide register form
    forgotPasswordForm.style.display = 'none'; // hide forgot password form
    clearErrors();
}

function showForgotPassword(){
    loginForm.style.display = 'none'; // hide login form
    registerForm.style.display = 'none'; // hide register form
    forgotPasswordForm.style.display = 'block'; // show forgot password form
    clearErrors();
}

function clearErrors(){
    document.getElementById('login-error').innerText = '';
    document.getElementById('register-error').innerText = '';
}

//login functions
async function login(){
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const error = document.getElementById('login-error');

    try{
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user);
        loadUserData();
    } catch (error){
        error.innerText = error.message;
    }
}


//register function
async function register(){
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const error = document.getElementById('register-error');

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
        // load user data
        loadUserData();

    } catch(error){
        error.innerText = error.message;
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

// forgot password function
async function resetPassword(){
    const email = document.getElementById('forgot-password-email').value;
    const newPassword = document.getElementById('forgot-password-new').value;
    const confirmPassword = document.getElementById('confirm-forgot-password-new').value;
    const error = document.getElementById('forgot-password-error');

    if(newPassword !== confirmPassword){
        error.innerText = "Passwords do not match.";
        return;
    } 

    try{
        // send password reset email
        await auth.sendPasswordResetEmail(email);
        console.log('Password reset email sent to:', email);
        alert('Password reset email sent. Please check your inbox.');
    } catch(error){
        error.innerText = error.message;
    }
}


// show forgot password form
function showForgotPassword(){
    loginForm.style.display = 'none'; // hide login form
    registerForm.style.display = 'none'; // hide register form
    document.getElementById('forgot-password-form').style.display = 'block'; // show forgot password form
    clearErrors();
}

// add event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
});