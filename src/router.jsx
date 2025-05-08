import {createBrowserRouter} from "react-router-dom";
import App from "./App";
import CrearEvento from "./pages/CrearEvento.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import "./index.css"
import Dashboard from "./pages/Dashboard.jsx";

export const router =  createBrowserRouter([
    {path:"/",element: <App />},
    {path:"/iniciar-sesion",element: <Login />},
    {path:"/registro",element: <Register />},
    {path:"/crear-evento",element: <CrearEvento />},
    {path:"/dashboard",element: <Dashboard />},
])