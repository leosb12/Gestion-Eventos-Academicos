import React, { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient.js'
import EventCard from './EventCard.jsx'

const Events = () => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('evento')
      .select('id,nombre,imagen_url')
      .order('fechainicio', { ascending: true })

    if (error) {
      console.error('Error al cargar eventos:', error)
    } else {
      setEvents(data)
    }
  }

  return (
    <section className="container my-5">
      <h2 className="text-center mb-4">¡No te Pierdas los Próximos Eventos!</h2>
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {events.map(evt => (
          <EventCard key={evt.id} evento={evt} />
        ))}
      </div>
    </section>
  )
}

export default Events
