
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    // Show a loading state while checking authentication
    if(loading){
        return <p>Loading...</p>
    }

    // If the user is not authenticated, redirect to the login page
    if(!user){
        return <Navigate to="/" replace = { true } />
    }

    return children 
}

function RoleProtectedRoute({ children, allowedRoles }) {
    const { user, profile, loading } = useAuth()
    if(loading){
        return <p>Loading...</p>
    }

    if(!user){
        return <Navigate to="/" replace = { true } />
    }

    if(!profile){
        return <Navigate to="/Home" replace = { true } />
    }

    if(allowedRoles.includes('admin') && profile.role === 'admin'){
        return children
    }

    if(allowedRoles.includes('user') && profile.role === 'user'){
        return children
    }

    if(allowedRoles.includes('seller') && profile.role === 'seller'){
        return children
    }

    if(!allowedRoles.includes(profile?.role)){
        return <Navigate to="/Home" replace = { true } />
    }

    return children
}

export { RoleProtectedRoute}
export default ProtectedRoute