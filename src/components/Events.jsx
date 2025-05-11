

const Events = () => {
    const events = [
          {
            title: "Taller: Diseños y Configuraciones de Redes eKIT para PYMES ",
            image: "/Conferencia1.jpg",
            link: "#"
          },
          {
            title: "Taller: Manejo y Uso de Drones ",
            image: "/sopenco.jpg",
            link: "#"
          },
          {
            title: "Conferencia: Ejecutando la IA desde tu PC",
            image: "/Conferencia2.jpg",
            link: "#"
          },
          {
            title: "Conferencia: Minunux Linux, Sientete Seguro de Usar Linux",
            image: "/Conferencia3.jpg",
            link: "#"
          },
          {
            title: "Taller: Ensamblado y Soporte de Computadoras ",
            image: "/Taller1.jpg",
            link: "#"
          },
          {
            title: "Feria Facultativa: Inscripción Semilleros",
            image: "/Feria1.jpg",
            link: "#"
          }
    ];

    return (
        <section>
          <div className="container">
            <div className="row row-cols-1 row-cols-lg-3 g-4 mb-5">
              {events.map((event, index) => (
                <div className="col" key={index}>
                  <div className="card h-100 bg-white p-5 rounded-5 border-light border-4 shadow-sm">
                    <img className="card-img-top mb-2" src={event.image} alt={event.title} />
                    <div className="card-body d-flex flex-column">
                      <h2 className="card-title text-center mb-4 fs-3 fw-bold fs-md-4">{event.title}</h2>
                      <div className="mt-auto text-center">
                        <a href={event.link} className="btn btn-primary px-5 py-3 fw-bold">Inscribirse</a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
    );
};

export default Events;