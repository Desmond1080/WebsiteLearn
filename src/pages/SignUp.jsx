import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../css/SignUp.css';

function SignUp()  {
    const { signUp, signOut } = useAuth();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword ] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    async function handleSignUp(e){
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try{
            if(!fullName || !username || !email || !password){
                setError('Please fill in all required fields');
                return;
            }

            const profileData = {
                full_name: fullName,
                username: username,
                role: 'user',
                gender: gender,
                description: description,
            }

            const newUser = await signUp(email, password, profileData);
            if(!newUser){
                setError('Failed to create account. Please try again.');
                return;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: newUser.id,
                    ...profileData,
                })
            if(profileError){
                console.error('Error creating profile:', profileError)
                const details = [profileError.message, profileError.details, profileError.hint]
                    .filter(Boolean)
                    .join(' | ')
                setError(`Profile save failed: ${details}`)
                return;
            }

            const { data: savedProfile, error: verifyError } = await supabase
                .from('profiles')
                .select('id, full_name, username, role, gender, description')
                .eq('id', newUser.id)
                .maybeSingle()

            if(verifyError){
                const details = [verifyError.message, verifyError.details, verifyError.hint]
                    .filter(Boolean)
                    .join(' | ')
                setError(`Profile verify failed: ${details}`)
                return;
            }

            if(!savedProfile){
                setError('Profile row was not found after save. Check RLS policies for insert/select on profiles.')
                return;
            }

            await signOut()
            navigate('/', { replace: true });
        } catch (e) {
            console.error('Sign up exception:', e)
            setError(e?.message || 'Sign up failed. Please try again.')
        } finally {
            setIsSubmitting(false);
        }
    }

    return(
        <section id="user-sign-up">
            <div className="sign-up-form">
                <h1>Sign Up</h1>
                <form onSubmit={handleSignUp}>
                    <label htmlFor="fullName">Full Name:</label>
                    <input type="text" id="fullName" name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />

                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" required value={username} onChange={(e) => setUsername(e.target.value)} />

                    <label htmlFor="description">Description: </label>
                    <input type="text" id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />

                    <label htmlFor="gender">Gender: </label>
                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>

                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <p className="error">{error}</p>}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            </div>
        </section>
    )
}

export default SignUp;