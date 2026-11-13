import Image from "next/image";
import Link from "next/link";
import Opening from "./opening";
import ConceptFigure from "./concept-figure";
import CottageStory from "./cottage-story";
import MotionProvider from "./motion-provider";
import SiteFooter from "./site-footer";
import { ArrowRight } from "./icons";
import { getScene } from "./resort-assets";
import Reveal from "./reveal";

export default function Home() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#vision">Skip to content</a>
      <main id="main-content" tabIndex={-1}>
        <Opening slides={[
          { scene: getScene("hero-pool-day-desktop-p37"), mobile: getScene("hero-pool-arch-mobile-p35"), title: "A courtyard, imagined.", label: "Pool cottage concept", alt: "Artist’s impression of a pool courtyard and illuminated arched seat", focalPoint: "center 54%", mobileFocalPoint: "51% center" },
          { scene: getScene("arrival-reception-lounge-p11"), title: "A welcome, taking shape.", label: "Reception lounge concept", alt: "Artist’s impression of a double-height reception lounge with garden-facing glazing", focalPoint: "center center", mobileFocalPoint: "53% center" },
          { scene: getScene("cottage-interior-front-bed-p40"), title: "A quieter interior.", label: "Cottage interior study · Scheme unconfirmed", alt: "Artist’s impression of a cottage bedroom with a timber ceiling and botanical artwork", focalPoint: "center 54%", mobileFocalPoint: "48% center" },
        ]} />

        <section id="vision" className="vision-section wrap" aria-labelledby="vision-title" tabIndex={-1}>
          <Reveal className="vision-index"><span className="arch-mark" aria-hidden="true" /><p>Golden Hills Resort<br />The design vision</p></Reveal>
          <Reveal className="vision-statement" delay={0.08}>
            <p className="section-note">A first look at the place</p>
            <h2 id="vision-title">Not quite a place.<br />Already a feeling.</h2>
            <div className="vision-details"><p>Golden Hills Resort is in development. This is a first look at a collection of spaces imagined for a slower pace.</p>
              <p>Every property image is an artist’s impression, not a photograph of a completed resort. Designs and details may change as the vision takes shape.</p></div>
          </Reveal>
        </section>

        <section id="spaces" className="arrival-section" aria-labelledby="arrival-title" tabIndex={-1}>
          <div className="arrival-layout wrap">
            <Reveal className="arrival-copy">
              <p className="section-note">Arrival &amp; interiors</p>
              <h2 id="arrival-title">The first welcome<br />sets the pace.</h2>
              <p>From the first welcome to the cottage interior, these studies explore a softer sense of arrival.</p>
              <a className="text-link" href="#cottages">See the cottage studies <ArrowRight size={16} /></a>
            </Reveal>
            <Reveal className="arrival-figure" delay={0.1}>
              <ConceptFigure scene={getScene("arrival-reception-lounge-p11")} alt="Double-height reception lounge concept with full-height glazing and a patterned floor" label="Reception lounge concept" sizes="(max-width: 700px) 100vw, 68vw" />
            </Reveal>
            <Reveal className="arrival-detail" delay={0.16}>
              <ConceptFigure scene={getScene("cottage-interior-front-bed-p40")} alt="Cottage bedroom concept with timber ceiling, botanical art and a low bed" label="Cottage interior study" sizes="(max-width: 700px) 80vw, 28vw" />
              <p>Warm timber. Soft light. A possible direction for the cottage interiors, awaiting final selection.</p>
            </Reveal>
          </div>
        </section>

        <CottageStory views={[getScene("cottage-entry-p32"), getScene("cottage-pool-overhead-p33"), getScene("cottage-pool-terrace-p34")]} />

        <section id="dining" className="dining-section" aria-labelledby="dining-title" tabIndex={-1}>
          <div className="dining-layout wrap">
            <div className="dining-heading"><p className="section-note">Around the table</p><h2 id="dining-title">Good company.<br />Different moods.</h2></div>
            <p className="dining-copy">Early restaurant studies explore the spaces where people might gather over a meal. The designs and dining offerings are not yet confirmed.</p>
            <ConceptFigure scene={getScene("dining-veg-seating-p13")} alt="Vegetarian dining concept with pendant lighting and upholstered seating" label="Vegetarian dining concept" sizes="(max-width: 700px) 100vw, 65vw" className="dining-main" />
            <ConceptFigure scene={getScene("dining-non-veg-aisle-p07")} alt="Non-vegetarian restaurant concept with a central aisle and curved timber detailing" label="Non-vegetarian dining concept" sizes="(max-width: 700px) 82vw, 29vw" className="dining-detail" />
            <p className="dining-aside">A place at the table.<br />A new part of the story.</p>
          </div>
          <div className="evening-chapter">
            <div className="evening-inner wrap"><h3>After hours.</h3>
              <ConceptFigure scene={getScene("evening-bar-wide-p09")} alt="Bar lounge concept with patterned flooring, green banquettes and a warmly lit counter" label="Bar lounge concept" sizes="(max-width: 700px) 100vw, 71vw" className="bar-view" />
              <div className="evening-copy"><span className="evening-rule" aria-hidden="true" /><p>A richer palette.<br />Another atmosphere.</p><p>This bar-area study explores an evening setting. Its design remains subject to approval.</p></div>
            </div>
          </div>
        </section>

        <section id="gatherings" className="gatherings-section wrap" aria-labelledby="gatherings-title" tabIndex={-1}>
          <div className="gatherings-heading"><p className="section-note">Room to gather</p><h2 id="gatherings-title">Better, together.</h2></div>
          <ConceptFigure scene={getScene("gatherings-banquet-p03")} alt="Conference hall concept with round banquet tables beneath a timber-framed ceiling" label="Conference hall · Banquet layout study" sizes="(max-width: 700px) 100vw, 72vw" className="gatherings-view" />
          <p className="gatherings-copy">The conference-hall proposal imagines a setting for shared occasions. Its layout, capacity and event capabilities are still to be confirmed.</p>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="closing-media" aria-hidden="true">
            <Image src={getScene("dusk-pool-candidate-p38").src} alt="" fill sizes="100vw" />
          </div>
          <div className="closing-scrim" aria-hidden="true" />
          <div className="closing-inner wrap">
            <div className="closing-copy">
              <p>A first look. A story still unfolding.</p>
              <h2 id="closing-title">A place<br />taking shape.</h2>
            </div>
            <Link className="explore-button closing-cta" href="/plan-ahead#bookings">Plan ahead <ArrowRight size={16} /></Link>
          </div>
          <p className="closing-meta">Dusk pool concept · Artist’s impression. Design subject to change.</p>
        </section>
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
