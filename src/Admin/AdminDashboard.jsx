import { useAuth } from '../context/AuthContext'

function AdminDashboard(){
    const { user, profile } = useAuth()

    return(
        <section id="admin-dashboard">
            <div className="admin-content">
                <h1>Admin Dashboard</h1>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Role:</strong> {profile?.role || 'N/A'}</p>
            </div>
        </section>
    )
}

export default AdminDashboard