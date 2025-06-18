// src/App.jsx
import React, {useState} from 'react';
import Navbar from './components/Navbar.jsx';
import Carousel from './components/Carousel.jsx';
import TypewriterComponent from './components/TypewriterComponent.jsx';
import Events from './components/Events.jsx';
import {toast, ToastContainer} from 'react-toastify'; // ya lo tenías, solo asegúrate
import 'react-toastify/dist/ReactToastify.css';
import FiltroEventos from './components/FiltrarEvento.jsx';
import {useLocation} from 'react-router-dom';
import {useEffect} from 'react';


const App = () => {
    const [filtros, setFiltros] = useState({
        categoria: '',
        ubicacion: '',
        fechaInicio: '',
        fechaFin: ''
    });
    const location = useLocation();

    useEffect(() => {
        if (location.state?.eventoCreado) {
            toast.success('Evento creado correctamente. No olvides revisar “Mis Eventos” para gestionarlo.”');

            // Espera 1ms para permitir que el toast se dispare antes de limpiar
            setTimeout(() => {
                window.history.replaceState({}, document.title);
            }, 1);
        }
    }, [location]);

    return (
        <>
            <Navbar/>

            {/* Carrusel de imágenes */}
            <Carousel/>

            {/* Texto animado */}
            <TypewriterComponent/>

            {/* Icono filtrar */}
            <FiltroEventos onFiltroChange={setFiltros}/>

            {/* Listado de eventos */}
            <Events filtros={filtros}/>
            <ToastContainer position="top-right" autoClose={3000}/>


        </>
    );
};

export default App;
