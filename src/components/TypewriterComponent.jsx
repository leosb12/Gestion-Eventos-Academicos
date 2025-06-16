import {useEffect, useRef} from 'react';
import Typewriter from 'typewriter-effect/dist/core';

const TypewriterText = () => {
    const typewriterRef = useRef(null);

    useEffect(() => {
        const typewriter = new Typewriter(typewriterRef.current, {
            loop: true,
            delay: 75,
        });

        typewriter
            .typeString('¡No te Pierdas los Próximos\nEventos de la Facultad!')
            .pauseFor(2000)
            .deleteAll()
            .start();
    }, []);

    return (
        <section
            className="container-fluid w-100 mx-auto text-center pt-5 mb-3"
            id="intro"
            style={{
                position: 'relative',
                minHeight: '7.5rem', // Espacio suficiente para texto en móviles
                overflow: 'hidden',
            }}
        >
            <h1
                className="p-3 fs-1 fs-sm-2 fs-md-1 border-top border-3"
                ref={typewriterRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    margin: 'auto',
                }}
            ></h1>
        </section>
    );
};

export default TypewriterText;
