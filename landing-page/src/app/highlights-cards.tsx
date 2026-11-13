export type HighlightItem = {
  num: string;
  title: string;
  desc: string;
};

export default function HighlightsCards({ items }: { items: HighlightItem[] }) {
  return (
    <div className="highlights-grid" role="list" aria-label="Why Choose Us Highlights">
      {items.map(({ num, title, desc }) => (
        <article className="highlight-card" key={num} role="listitem">
          <span className="highlight-num" aria-hidden="true">{num}</span>
          <h3>{title}</h3>
          <p className="highlight-desc">{desc}</p>
        </article>
      ))}
    </div>
  );
}
