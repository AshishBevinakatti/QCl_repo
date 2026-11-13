"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "./icons";
import { getScene } from "./resort-assets";

export type RoomImage = {
  sceneId: string;
  label: string;
  alt: string;
};

export type RoomCategory = {
  name: string;
  zone: string;
  specs: string;
  lead: string;
  startingTariff?: string;
  tariffUnit?: string;
  taxNote?: string;
  highlights: string[];
  mealPlans: string[];
  policyNotes: string[];
  images: RoomImage[];
};

function RoomCardMedia({
  images,
  roomName,
}: {
  images: RoomImage[];
  roomName: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImg = images[currentIdx] || images[0];
  const scene = getScene(currentImg.sceneId);

  return (
    <div className="rc-media">
      <div className="rc-media-frame">
        <Image
          src={scene.src}
          alt={currentImg.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
          className="rc-media-img"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="rc-nav-btn rc-nav-prev"
              aria-label={`Previous image of ${roomName}`}
              onClick={prevSlide}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="rc-nav-btn rc-nav-next"
              aria-label={`Next image of ${roomName}`}
              onClick={nextSlide}
            >
              <ChevronRight size={14} />
            </button>

            <span className="rc-counter">
              {currentIdx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function StayCards({ rooms }: { rooms: RoomCategory[] }) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderCard = (room: RoomCategory, idx: number) => {
    const isExpanded = expandedIndices.includes(idx);

    /* Extract compact specs for the stats row */
    const specParts = room.specs.split(" · ");

    return (
      <article
        className={`ref-card ${isExpanded ? "is-expanded" : ""}`}
        key={room.name}
        role="listitem"
      >
        {/* Large image on top */}
        <RoomCardMedia images={room.images} roomName={room.name} />

        {/* Card body */}
        <div className="rc-body">
          <h3 className="rc-name">{room.name}</h3>
          <p className="rc-desc">{room.lead}</p>

          {/* Stats row */}
          <div className="rc-stats-row">
            {specParts.map((spec, i) => (
              <span key={i} className="rc-stat">
                {spec}
              </span>
            ))}
          </div>

          {/* Expandable details */}
          <div className={`rc-dropdown ${isExpanded ? "is-open" : ""}`}>
            <div className="rc-dropdown-inner">
              <div className="rc-detail-section">
                <span className="rc-detail-label">Meal Plans</span>
                <div className="rc-pills">
                  {room.mealPlans.map((plan) => (
                    <span key={plan} className="rc-pill">{plan}</span>
                  ))}
                </div>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Highlights</span>
                <ul className="rc-detail-list">
                  {room.highlights.map((hl) => (
                    <li key={hl}>{hl}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Inclusions & Policies</span>
                <ul className="rc-detail-list">
                  {room.policyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer: dropdown toggle + CTA & Rate */}
          <div className="rc-footer">
            <button
              type="button"
              className="rc-more-btn"
              aria-label={isExpanded ? `Hide details for ${room.name}` : `View details for ${room.name}`}
              onClick={() => toggleCard(idx)}
            >
              <span>{isExpanded ? "Less details" : "More details"}</span>
              <ChevronDown size={12} className={`rc-chevron ${isExpanded ? "is-flipped" : ""}`} />
            </button>

            <div className="rc-book-action">
              {room.startingTariff && (
                <div className="rc-price-display">
                  <div className="rc-price-main">
                    <span className="rc-price-val">{room.startingTariff}</span>
                    <span className="rc-price-unit">{room.tariffUnit || "/ night"}</span>
                  </div>
                  <span className="rc-price-sub">{room.taxNote || "Excl. 12% GST"}</span>
                </div>
              )}
              <Link href="/plan-ahead#bookings" className="rc-cta-btn">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="ref-cards-grid" role="region" aria-label="Room and cottage categories">
      <div className="ref-cards-columns" role="list">
        <div className="ref-cards-col">
          {rooms[0] && renderCard(rooms[0], 0)}
          {rooms[3] && renderCard(rooms[3], 3)}
        </div>
        <div className="ref-cards-col">
          {rooms[1] && renderCard(rooms[1], 1)}
          {rooms[4] && renderCard(rooms[4], 4)}
        </div>
        <div className="ref-cards-col">
          {rooms[2] && renderCard(rooms[2], 2)}
          {rooms[5] && renderCard(rooms[5], 5)}
        </div>
      </div>

      <div className="ref-cards-mobile" role="list">
        {rooms.map((room, idx) => renderCard(room, idx))}
      </div>

      <p className="cards-editorial-footnote">
        Architectural concept impressions. Final finishes, dimensions and room appointments subject to pre-opening verification.
      </p>
    </div>
  );
}
