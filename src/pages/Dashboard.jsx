import React from 'react';
import "../index.css"
import {UserAuth} from "../context/AuthContext.jsx";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";

const Dashboard = () => {
    const {session, signOut} = UserAuth();
    const navigate = useNavigate();

    const handleSignOut = async (e) => {
        e.preventDefault();
        try{
            await signOut();
            navigate("/");
        } catch (error) {
            toast.error("Error al cerrar sesion: " + error.message)
        }
    }
    return (
        <div className="dashboard-container">
          <h1 className="h4 mb-3">Dashboard</h1>
          <button onClick={handleSignOut} className="logout-button">Cerrar sesión</button>
        </div>
    );
};

export default Dashboard;