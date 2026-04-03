import { useAuth } from '../context/AuthContext.jsx'
import { Navigate } from 'react-router-dom'

function SellerDashboard() {
    const { user, profile, loading } = useAuth()

    if(loading){
        return <p>Loading...</p>
    }

    if(!user){
        return <Navigate to="/" replace = { true } />
    }

    return(
        <section id="seller-dashboard">
            <div className="seller-content">
                <h1>Seller Dashboard</h1>
            </div>
        </section>
    )
}

export default SellerDashboard