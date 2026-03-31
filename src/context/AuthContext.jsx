import React, { createContext, useState, useEffect, useMemo, useContext} from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

async function fetchProfile(userId){
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single()

    if(error){
        console.error('Error fetching profile:', error)
        return null
    }
    return data
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true 

        async function initAuth(){
            const { data } = await supabase.auth.getSession()
            const currentUser = data?.session?.user || null

            if(!mounted) return 

            setUser(currentUser)
            setProfile(currentUser ? await fetchProfile(currentUser.id) : null)
            setLoading(false)
        }

        initAuth()

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null
            setUser(currentUser)
            setProfile(currentUser ? await fetchProfile(currentUser.id) : null)
        })

        return () => {
            mounted = false
            authListener.subscription.unsubscribe()
        }
    }, [])

    async function signUp(email, password){
        const { user, error } = await supabase.auth.signUp({ email, password })
        if(error){
            console.error('Error signing up:', error)
            return null
        }
        return user
    }

    async function signIn(email, password){
        const { user, error } = await supabase.auth.signInWithPassword({ email, password })
        if(error){
            console.error('Error signing in:', error)
            return null
        }
        return user
    }

    async function signOut(){
        const { error } = await supabase.auth.signOut()
        if(error){
            console.error('Error signing out:', error)
        }
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
    }), [user, profile])}>
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

