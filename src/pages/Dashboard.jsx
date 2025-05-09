import React from 'react';
import "../index.css"
import {UserAuth} from "../context/AuthContext.jsx";
import {NavLink, useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import Navbar from "../components/Navbar.jsx";

const Dashboard = () => {
    const {session, signOut} = UserAuth();
    const navigate = useNavigate();

    const handleSignOut = async (e) => {
        e.preventDefault();
        try{
            await signOut();
            navigate("/iniciar-sesion");
        } catch (error) {
            toast.error("Error al cerrar sesion: " + error.message)
        }
    }
    return (
        <div>
            <Navbar/>
             <div className="dashboard-container">
              <h1 className="h4 mb-3">Dashboard</h1>
              <button onClick={handleSignOut} className="logout-button">Cerrar sesión</button>
            </div>
        </div>

    );
};

export default Dashboard;