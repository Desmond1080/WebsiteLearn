import React, { createContext, useState, useEffect, useMemo, useContext} from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

async function fetchProfile(userId){
    console.log('Fetching profile for user ID:', userId)

    try {
        const result = await Promise.race([
            supabase
                .from('profiles')
                .select('id, full_name, username, role, gender, description')
                .eq('id', userId)
                .maybeSingle(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile request timeout')), 10000)
            ),
        ])

        const { data, error } = result
        console.log('fetchProfile query result:', { data, error })

        if(error){
            console.error('Error fetching profile:', error)
            return null
        }
        return data
    } catch (error) {
        console.error('fetchProfile exception:', error)
        return null
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true 

        async function initAuth(){
            try {
                const { data } = await supabase.auth.getSession()
                const currentUser = data?.session?.user || null
        
                if(!mounted) return 

                setUser(currentUser)
                if(mounted) setLoading(false)

                if(currentUser) {
                    console.log('initAuth calling fetchProfile for:', currentUser.id)
                    const profileData = await fetchProfile(currentUser.id)
                    if(mounted) setProfile(profileData)
                } else {
                    if(mounted) setProfile(null)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                if(mounted) {
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                }
            }
        }

        initAuth()

        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                const currentUser = session?.user || null
                setUser(currentUser)
                setLoading(false)

                if(currentUser) {
                    console.log('auth state change calling fetchProfile for:', currentUser.id)
                    const profileData = await fetchProfile(currentUser.id)
                    if(mounted) setProfile(profileData)
                } else {
                    if(mounted) setProfile(null)
                }
                if(mounted) setLoading(false)
                
                if(event === 'SIGNED_OUT'){
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                }
            } catch (error) {
                console.error('Error in auth state change:', error)
                if(mounted) setLoading(false)
            }
        })

        return () => {
            mounted = false
            data?.subscription?.unsubscribe()
        }
    }, [])

    async function signUp(email, password, userData = {}){
        console.log('signUp called in AuthContext');
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            })

            if(error){
                console.error('Error signing up:', error)
                return null
            }
            return data?.user ?? null
        } catch (e) {
            console.error('signUp exception:', e)
            return null
        }
    }

    async function signIn(email, password){
        console.log('signIn called in AuthContext');
        try {
            console.log('Calling supabase.auth.signInWithPassword...');
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            console.log('Supabase response:', { data, error });
            
            if(error){
                console.error('Supabase auth error:', error.message || error);
                return null
            }
            console.log('Sign in successful, user:', data?.user);
            return data?.user ?? null
        } catch (e) {
            console.error('signIn exception:', e);
            return null
        }
    }

    async function signOut(){
        setUser(null)
        setProfile(null)
        setLoading(false)
        const { error } = await supabase.auth.signOut()
        if(error){
            console.error('Error signing out:', error)
            return false;
        }
        return true;
    }

    function hasRole(...roles){
        return !!profile?.role && roles.includes(profile.role)
    }

    return <AuthContext.Provider value={useMemo(() => ({
        user,
        profile,
        signUp,
        signIn,
        signOut,
        hasRole,
        loading
    }), [user, profile, loading])}>
        {children}
    </AuthContext.Provider>

}

export function useAuth(){
    const context = useContext(AuthContext)
    if(!context){
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

