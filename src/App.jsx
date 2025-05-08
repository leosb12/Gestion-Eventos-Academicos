import {useState} from "react";
import Navbar from "./components/Navbar.jsx";
import Carousel from "./components/Carousel.jsx";
import TypewriterComponent from "./components/TypewriterComponent.jsx";
import Events from "./components/Events.jsx";
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