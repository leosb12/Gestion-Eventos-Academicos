import React from 'react'
import Navbar from "./Components/Navbar.jsx";
import Carousel from "./Components/Carousel.jsx";
import Events from "./Components/Events.jsx";
import TypewriterComponent from "./Components/TypewriterComponent.jsx";
import './App.css';
import './index.css'

const App = () => {
    return (
        <div>
            <Navbar/>
            <Carousel/>
            <TypewriterComponent/>
            <Events/>
        </div>
    )
}

export default App