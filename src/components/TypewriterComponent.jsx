import { useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect/dist/core';

const TypewriterText = () => {
  const typewriterRef = useRef(null);

  useEffect(() => {
    const typewriter = new Typewriter(typewriterRef.current, {
      loop: true,
      delay: 75,
    });

    typewriter
      .typeString('¡Descubre los próximos EVENTOS de la facultad!')
      .pauseFor(200)
      .start();
  }, []);

  return (
    <section className="container-fluid w-50 mx-auto text-center pt-5 mb-sm-1 mb-lg-3" id="intro">
      <h1 className="p-3 fs-1 border-top border-3" ref={typewriterRef}></h1>
    </section>
  );
};

export default TypewriterText;;