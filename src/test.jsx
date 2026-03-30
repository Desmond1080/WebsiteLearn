import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App(){
    const [count, setCount] = useState(0)

    return(
        <div class="test-react">
            <h1>Vite + React</h1>
            <div class="react-logo">
                <img src={reactLogo} class="logo" alt="React logo" />
            </div>
            <div class="vite-logo">
                <img src={viteLogo} class="logo" alt="Vite logo" />
            </div>
            <div class="hero-image">
                <img src={heroImg} alt="Hero" />
            </div>
        </div>
    )
}