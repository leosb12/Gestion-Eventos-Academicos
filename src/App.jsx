// src/App.jsx
import React from 'react'
import Navbar from './components/Navbar.jsx'
import Carousel from './components/Carousel.jsx'
import TypewriterComponent from './components/TypewriterComponent.jsx'
import Events from './components/Events.jsx'

const App = () => {
  return (
    <>
      <Navbar />

      {/* Carrusel de imágenes */}
      <Carousel />

      {/* Texto animado */}
      <TypewriterComponent />

      {/* Listado de eventos */}
      <Events />
    </>
  )
}

export default App
