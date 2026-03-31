
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import '../css/Login.css';


function Login(){
    const { login, error} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return(
        <section id="login">
            <div className="login-form">
                <h1>Login</h1>
                <form>
                    <label htmlFor="email">Email:</label>
                    <input type="text" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />    
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" onClick={(e) => {
                        e.preventDefault();
                        // Handle login logic here
                        if(email && password){
                            login(email, password)
                        }else{
                            error && alert(error)
                            alert('Please enter both email and password')
                        }
                    }}>
                        Login
                    </button>
                </form>
            </div>
        </section>
    )
}

export default Login;