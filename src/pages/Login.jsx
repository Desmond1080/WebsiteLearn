
import { useAuth } from '../context/AuthContext';
import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../css/Login.css';



function Login(){
    const { signIn, user, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && !loading) {
            navigate('/Home', { replace: true });
        }
    }, [user, loading, navigate]);

    async function handleLogin(e){
        e.preventDefault();
        setLoginError(null);
        setIsSubmitting(true);

        console.log('Attempting login with email:', email);

        try{
            if(!email || !password){
                console.log('Email or password missing');
                setLoginError('Please enter both email and password');
                return;
            }

            console.log('Calling signIn with:', { email, password });
            const loggedUser = await signIn(email, password);
            console.log('Login result:', loggedUser);

            if(!loggedUser){
                setLoginError('Invalid email or password');
                return;
            }
            console.log('Login successful, navigating to Home');
            navigate('/Home', { replace: true });
        } finally {
            setIsSubmitting(false);
        }
    }

    return(
        <section id="login">
            <div className="login-form">
                {/* <FontAwesomeIcon icon={faUser} /> */}
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <label htmlFor="email">Email:</label>
                    <input type="text" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />    
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    {loginError && <p className="error">{loginError}</p>}
                    <button type="submit" disabled={isSubmitting}>
                        Login
                    </button>
                </form>

                <div className="sign-up-links">
                    <p>Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
                </div>
            </div>
        </section>
    )
}

export default Login;