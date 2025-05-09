

const Events = () => {
    const events = [
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
            link: "#"
          },
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
            link: "#"
          },
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
            link: "#"
          },
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
            link: "#"
          },
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
            link: "#"
          },
          {
            title: "Taller robótica y manejo empresarial 1-2025",
            image: "/kiko.jpg",
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