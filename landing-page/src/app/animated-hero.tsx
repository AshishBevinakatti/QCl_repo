"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";
import { useState, type CSSProperties } from "react";
import { useMotionPreference } from "./motion-provider";
import { impression, type Scene } from "./resort-assets";
import { ArrowDown, ArrowLeft, ArrowRight } from "./icons";

export type HeroSlide = {
  scene: Scene; mobile?: Scene; title: string; label: string; alt: string;
  focalPoint: string; mobileFocalPoint: string;
};

export default function AnimatedHero({ slides, ready, revealed, revealOpacity, revealY, imageScale }: {
  slides: HeroSlide[]; ready: boolean; revealed: boolean; revealOpacity: MotionValue<number>; revealY: MotionValue<number>; imageScale: MotionValue<number>;
}) {
  const reduced = useMotionPreference();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  function change(direction: number) {
    setIndex(value => (value + direction + slides.length) % slides.length);
  }

  return (
    <section className="hero opening-slideshow" aria-roledescription="carousel" aria-label="Golden Hills resort design concepts" inert={ready && !revealed}>
      <figure className="hero-figure">
        <div className="hero-window" id="hero-slides">
          {slides.map((item, position) => (
            <motion.div key={item.scene.src} className={`hero-slide hero-slide-${position}`} initial={false}
              animate={{ opacity: index === position ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={index !== position}
              style={{ "--slide-focal": item.focalPoint, "--slide-mobile-focal": item.mobileFocalPoint } as CSSProperties}>
              <motion.div className="hero-media" style={{ scale: imageScale }}><picture>
                {item.mobile && <source media="(max-width: 999px)" srcSet={item.mobile.src} />}
                <Image {...item.scene} sizes="100vw" preload={position === 0} alt={item.alt} />
              </picture></motion.div>
            </motion.div>
          ))}
          <div className="hero-shade" aria-hidden="true" />
        </div>
        <figcaption className="hero-disclosure"><span>{slide.label}</span><span>{impression}</span></figcaption>
      </figure>

      <motion.div className="hero-heading" style={ready ? { opacity: revealOpacity, y: revealY } : undefined}>
        <p className="hero-status">A resort in the making</p>
        <motion.h1 id="hero-title" key={index} initial={reduced ? false : { opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}>{slide.title}</motion.h1>
      </motion.div>

      <motion.div className="hero-bottom" style={ready ? { opacity: revealOpacity, y: revealY } : undefined}>
        <a className="explore-button" href="#vision">Explore the vision <ArrowDown size={16} /></a>
      </motion.div>

      <motion.div className="slideshow-controls" hidden={!ready} style={ready ? { opacity: revealOpacity } : undefined} onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          change(event.key === "ArrowRight" ? 1 : -1);
        }
      }}>
        <div className="slide-navigation">
          <button type="button" aria-label="Previous concept" aria-controls="hero-slides" onClick={() => change(-1)}><ArrowLeft size={18} /></button>
          <span className="slide-position" aria-live="polite" aria-atomic="true">
            <span className="visually-hidden">Concept </span>{index + 1}<span aria-hidden="true"> / </span><span className="visually-hidden"> of </span>{slides.length}<span className="visually-hidden">. {slide.title}</span>
          </span>
          <button type="button" aria-label="Next concept" aria-controls="hero-slides" onClick={() => change(1)}><ArrowRight size={18} /></button>
        </div>
      </motion.div>
    </section>
  );
}
