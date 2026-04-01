
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

export default ProtectedRoute