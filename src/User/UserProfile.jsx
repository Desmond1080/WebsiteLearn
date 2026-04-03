import { useState } from 'react'
import { useAuth } from '../context/AuthContext'


function UserProfile(){
    const { user, profile } = useAuth()

    return(
        <section id="user-profile">
            <div className="user-info">
                <h2>Profile</h2>
                <p><strong>Name:</strong> {profile?.full_name || 'N/A'}</p>
                <p><strong>Username:</strong> {profile?.username || 'N/A'}</p>
                <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                <p><strong>Role:</strong> {profile?.role || 'N/A'}</p>
                <p><strong>Gender:</strong> {profile?.gender || 'N/A'}</p>
                <p><strong>Description: </strong>{profile?.description || 'N/A'}</p>
            </div>
        </section>
    )
}

export default UserProfile