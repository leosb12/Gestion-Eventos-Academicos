import React from 'react';

const Carousel = () => {
  return (
    <div
      id="carouselExample"
      className="carousel slide"
      data-bs-ride="carousel"
      style={{ maxWidth: '100%', margin: '0 auto' }}
    >
      <div className="carousel-inner">
        <div className="carousel-item active" data-bs-interval="3000">
          <img
            src="/sopenco.jpg"
            className="d-block w-100 carousel-inner"
            alt="kiko1"
          />
        </div>
        <div className="carousel-item" data-bs-interval="3000">
          <img
            src="/sisisis.jpg"
            className="d-block w-100 carousel-inner"
            alt="kiko2"
          />
        </div>
        <div className="carousel-item" data-bs-interval="3000">
          <img
            src="/Taller1.jpg"
            className="d-block w-100 carousel-inner"
            alt="kiko3"
          />
        </div>
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
};

export default Carousel;
