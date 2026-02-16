const totalDoctors = document.getElementById('doctor-list-content');
const adminNameEl = document.getElementById('admin-name');
const logoutButton = document.getElementById('admin-logout-button');
const logoutPopup = document.getElementById('logout-confirmation-popup');
const editDoctorNameInput = document.getElementById('edit-doctor-name');
const editDoctorUsernameInput = document.getElementById('edit-doctor-username');
const editDoctorSpecializationInput = document.getElementById('edit-doctor-specialization');
const editDoctorGenderInput = document.getElementById('edit-doctor-gender');
const editDoctorEmailInput = document.getElementById('edit-doctor-email');
let currentEditDoctorId = null;
let currentEditUserId = null;


//check auth state
async function checkAuthState(){
    auth.onAuthStateChanged(async (user) => {
        if(!user){
            window.location.href = '../User/UserLoginAndRegister.html';
            return;
        }
        if(adminNameEl){
            adminNameEl.textContent = user.displayName || user.email;
        }
    });
    loadDoctors();
}


// load doctors from firestore and display as table 
async function loadDoctors(){
    try{
        console.log('Doctors: loading doctor data...');
        const doctorsSnapshot = await db.collection('Doctors').get();
        const doctorsProfileSnapshot = await db.collection('Users').where('role', '==', 'doctor').get();
        console.log('Doctors: Doctors collection count', doctorsSnapshot.size);
        console.log('Doctors: Users role=doctor count', doctorsProfileSnapshot.size);
        
        if(doctorsSnapshot.empty){
            console.log('Doctors: Doctors collection is empty');
            return;
        }
        if(doctorsProfileSnapshot.empty){
            console.log('Doctors: No users with role=doctor found');
            return;
        }
        
        console.log('Doctors: First 3 Users doc IDs:', doctorsProfileSnapshot.docs.map(d => d.id).slice(0, 3));
        console.log('Doctors: First 3 Doctors userId values:', doctorsSnapshot.docs.map(d => d.data().userId).slice(0, 3));
        console.log('Doctors: First doctor doc sample:', doctorsSnapshot.docs[0]?.data());
        console.log('Doctors: First user doc sample:', doctorsProfileSnapshot.docs[0]?.data());
        
        let doctorListHTML = '<table style="width: 100%; border-collapse: collapse; margin: 20px auto;"><tr><th style="border: 1px solid #ccc; padding: 10px;">Doctor Name</th><th style="border: 1px solid #ccc; padding: 10px;">Username</th><th style="border: 1px solid #ccc; padding: 10px;">Specialization</th><th style="border: 1px solid #ccc; padding: 10px;">Gender</th><th style="border: 1px solid #ccc; padding: 10px;">Email</th><th style="border: 1px solid #ccc; padding: 10px;">Edit</th></tr>';

        if(!doctorsSnapshot.empty && !doctorsProfileSnapshot.empty){
            const doctorProfiles = {};
            doctorsProfileSnapshot.docs.forEach(element => {
                const doctorProfileData = element.data();
                doctorProfiles[element.id] = doctorProfileData;
            });
            
            // Create fallback join by email
            const doctorProfilesByEmail = {};
            doctorsProfileSnapshot.docs.forEach(element => {
                const doctorProfileData = element.data();
                if(doctorProfileData.email){
                    doctorProfilesByEmail[doctorProfileData.email.toLowerCase()] = doctorProfileData;
                }
            });

            doctorsSnapshot.forEach((doc) => {
                const doctorData = doc.data();
                
                // Get userId - handle both string and reference types
                const userId = typeof doctorData.userId === 'string' 
                    ? doctorData.userId 
                    : doctorData.userId?.id;
                
                console.log('Doctors: Processing userId type:', typeof doctorData.userId, 'extracted:', userId);
                
                // Join by userId (matches Users doc ID)
                let doctorProfile = doctorProfiles[userId];
                
                if(doctorProfile){
                    console.log('Doctors: Found matching profile for userId', userId);
                } else {
                    console.log('Doctors: No match for userId', userId, '- trying email fallback');
                }
                
                // Fallback to join by email
                if(!doctorProfile && doctorData.email){
                    doctorProfile = doctorProfilesByEmail[doctorData.email.toLowerCase()];
                    if(doctorProfile){
                        console.log('Doctors: Used email fallback for', doctorData.email);
                    }
                }

                doctorProfile = doctorProfile || {};
                const genderLabel = doctorProfile.gender || doctorData.gender || 'N/A';
                doctorListHTML += `<tr><td style="border: 1px solid #ccc; padding: 10px;">${doctorData.name || 'N/A'}</td><td style="border: 1px solid #ccc; padding: 10px;">${doctorProfile.username || 'N/A'}</td><td style="border: 1px solid #ccc; padding: 10px;">${doctorData.specialization || 'N/A'}</td><td style="border: 1px solid #ccc; padding: 10px;">${genderLabel}</td><td style="border: 1px solid #ccc; padding: 10px;">${doctorProfile.email || 'N/A'}</td><td style="border: 1px solid #ccc; padding: 10px; text-align: center;"><button type="button" onclick="showEditDoctorForm('${doc.id}')">Edit</button></td></tr>`;
            });
            doctorListHTML += '</table>';
            console.log('Doctors: final HTML length', doctorListHTML.length);
            console.log('Doctors: HTML preview:', doctorListHTML.substring(0, 200));
            console.log('Doctors: totalDoctors element exists?', !!totalDoctors);
            if(totalDoctors){
                totalDoctors.innerHTML = doctorListHTML;
                console.log('Doctors: HTML rendered to page');
                console.log('Doctors: element innerHTML after render:', totalDoctors.innerHTML.substring(0, 100));
            } else {
                console.log('Doctors: ERROR - totalDoctors element not found');
            }
        } else {
            console.log('Doctors: no matching data to display.');
            doctorListHTML += '<tr><td colspan="6">No doctors found</td></tr></table>';
            if(totalDoctors){
                totalDoctors.innerHTML = doctorListHTML;
            }
        }
    }catch(error){
        console.error('Error loading doctors:', error);
    }
}

checkAuthState();

//show edit form with doctor details
function showEditDoctorForm(doctorId){
    const adminMain = document.getElementById('admin-main');
    const editDoctorPopup = document.getElementById('edit-doctor-popup');
    if(editDoctorPopup){
        editDoctorPopup.style.display = 'flex';
        if(adminMain){
            adminMain.style.filter = 'blur(5px)';
        }
        document.body.style.overflow = 'hidden';
    }

    if(doctorId){
        currentEditDoctorId = doctorId;
        editDoctorDetails(doctorId);
    }

}

function closeEditDoctorPopup(){
    const adminMain = document.getElementById('admin-main');
    const editDoctorPopup = document.getElementById('edit-doctor-popup');
    if(editDoctorPopup){
        editDoctorPopup.style.display = 'none';
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

//update doctor details from edit form
async function updateProfile(){
    try{
        if(!currentEditDoctorId){
            console.error('No doctor selected for update.');
            return;
        }
        const doctorDocRef = db.collection('Doctors').doc(currentEditDoctorId);
        const doctorDoc = await doctorDocRef.get();
        if(!doctorDoc.exists){
            console.error('Doctor doc not found for update:', currentEditDoctorId);
            return;
        }
        const doctorData = doctorDoc.data();
        const userId = typeof doctorData.userId === 'string'
            ? doctorData.userId
            : doctorData.userId?.id;
        if(!userId){
            console.error('Doctor userId missing or invalid for update:', currentEditDoctorId);
            return;
        }
        const doctorProfileDocRef = db.collection('Users').doc(userId);
        const doctorProfileDoc = await doctorProfileDocRef.get();
        if(!doctorProfileDoc.exists){
            console.error('Doctor profile doc not found for update:', userId);
            return;
        }

        const updatedDoctorData = {
            name: editDoctorNameInput.value,
            specialization: editDoctorSpecializationInput.value,
        };
        const updatedDoctorProfileData = {
            username: editDoctorUsernameInput.value,
            gender: editDoctorGenderInput.value,
            email: editDoctorEmailInput.value,
        };
        await doctorDocRef.update(updatedDoctorData);
        await doctorProfileDocRef.update(updatedDoctorProfileData);
        closeEditDoctorPopup();
        showUpdateSuccessMessage();
        loadDoctors();
    }
    catch(error){
        console.error('Error updating doctor details:', error);
    }
}

//edit specific doctor details show in edit form like a pop up form 
async function editDoctorDetails(doctorId){
    try{
        const doctorDoc = await db.collection('Doctors').doc(doctorId).get();
        if(!doctorDoc.exists){
            console.error('Doctor doc not found for edit:', doctorId);
            return;
        }

        const doctorData = doctorDoc.data();
        const userId = typeof doctorData.userId === 'string'
            ? doctorData.userId
            : doctorData.userId?.id;

        if(!userId){
            console.error('Doctor userId missing or invalid for edit:', doctorId);
            return;
        }

        const doctorProfileDoc = await db.collection('Users').doc(userId).get();

        if(doctorProfileDoc.exists){
            const doctorData = doctorDoc.data();
            const doctorProfileData = doctorProfileDoc.data();
            if(editDoctorNameInput){
                editDoctorNameInput.value = doctorData.name || '';
            }
            if(editDoctorUsernameInput){
                editDoctorUsernameInput.value = doctorProfileData.username || '';
            }
            if(editDoctorSpecializationInput){
                editDoctorSpecializationInput.value = doctorData.specialization || '';
            }
            if(editDoctorGenderInput){
                editDoctorGenderInput.value = doctorProfileData.gender || '';
            }
            if(editDoctorEmailInput){
                editDoctorEmailInput.value = doctorProfileData.email || '';
            }
        }
    }catch(error){
        console.error('Error fetching doctor details for edit:', error);
        return;
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

document.addEventListener('DOMContentLoaded', setActiveNavLink);