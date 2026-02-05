const totalUser = document.getElementById('total-user-section');
const user = auth.currentUser;
const userRole = user.doc().role;

async function fetchTotalUsers(){
    if(user && userRole === 'admin'){
        try{
            const usersSnapshot = await db.collection("Users").get();
            const totalUsers = usersSnapshot.size;
            totalUser.innerText = totalUsers;
        }catch(error){
            console.error("Error fetching total users: ", error);
        }
    }else{
        console.error("No authenticated admin user found.");
        return;
    }
}