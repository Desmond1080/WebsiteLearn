const totalDoctors = document.getElementById('doctor-list-content');

// load doctors from firestore and display as table 
async function loadDoctors(){
    try{
        const doctorsSnapshot = await db.collection('Doctors').get();
        const doctorsProfileSnapshot = await db.collection('Users').where('role', '==', 'doctor').get();
        let doctorListHTML = '<table><tr><th>Doctor Name</th><th>Username</th><th>Specialization</th><th>Gender</th><th>Email</th></tr>';

        if(!doctorsSnapshot.empty && !doctorsProfileSnapshot.empty){
            const doctorProfiles = {};
            doctorsProfileSnapshot.docs.forEach(element => {
                const doctorProfileData = element.data();
                doctorProfiles[element.id] = doctorProfileData;
            });

            doctorsSnapshot.forEach((doc) => {
                const doctorData = doc.data();
                const doctorProfile = doctorProfiles[doctorData.userId] || {};
                doctorListHTML += `<tr><td>${doctorData.name || 'N/A'}</td><td>${doctorProfile.username || 'N/A'}</td><td>${doctorData.specialization || 'N/A'}</td><td>${doctorData.gender || 'N/A'}</td><td>${doctorProfile.email || 'N/A'}</td></tr>`;
            });
            doctorListHTML += '</table>';
            totalDoctors.innerHTML = doctorListHTML;
        }
    }catch(error){
        console.error('Error loading doctors:', error);
    }
}

loadDoctors();