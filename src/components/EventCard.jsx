

const EventCard = ({ title, imageUrl }) => {
    return (
        <div className="col">
            <div className="card h-100 bg-white p-5 rounded-5 border-light border-4 shadow-sm">
                <img className="card-img-top mb-2" src={imageUrl} alt={title} />
                <div className="card-body d-flex flex-column">
                    <h2 className="card-title text-center mb-4 fs-3 fw-bold fs-md-4">{title}</h2>
                    <div className="mt-auto text-center">
                        <button type="button" className="btn btn-primary px-5 py-3 fw-bold">Inscribirse</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;