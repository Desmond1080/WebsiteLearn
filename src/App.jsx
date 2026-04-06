import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './utils/supabaseClient'
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import PetList from './PetsOrdering/PetList.jsx'
import './App.css'


function App() {
  const { user, profile } = useAuth()
  const [count, setCount] = useState(0)  
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const getUser =  async () => {
      const { data } = await supabase.auth.getSession()
      const currentUser = data?.session?.user || null
      console.log('Current user:', currentUser)
    }

    getUser()
  }, [])

  async function handleSignOut(e){
    e.preventDefault()
    console.log('Signing out user:', user)
    const ok = await signOut()
    console.log('Sign out result:', ok)
    if(ok){
      console.log('Sign out successful, navigating to login page')
      navigate('/')
    }
  }

  return (
    <>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Link to="/todo">To-Do List</Link>
        <Link to="/profile">Profile</Link>
      </nav>

      <section id="center">
        <button onClick={(e) => handleSignOut(e)}>Log Out</button>
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Welcome to Desterriman Pet's Website</h1>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <button 
          className="reset"
          onClick={() => setCount(0)}
        >
          Reset
        </button>
        {count > 5 && <p>Counter is greater than 5!</p>}
      </section>

      <section id="next-steps">
        
        {/* show list of pets from different seller and category, and allow users to click on a pet to view more details about it. This could include information such as the pet's name, age, breed, and a description. You could also include photos of the pets to make the listings more appealing. */}
        <PetList />

      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
