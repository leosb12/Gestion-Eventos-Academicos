import React from 'react'
import './App.css';
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CrearEvento from "./pages/CrearEvento.jsx";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/iniciar-sesion" element={<Login/>}/>
                <Route path="/registro" element={<Register/>}/>
                <Route path="/crear-evento" element={<CrearEvento/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App