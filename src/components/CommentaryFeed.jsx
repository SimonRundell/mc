export default function CommentaryFeed({ lines }) {
  return (
    <div className="commentary-feed">
      <h3 className="commentary-feed__title">Commentary</h3>
      <ul className="commentary-feed__list">
        {lines
          .slice()
          .reverse()
          .map((line) => (
            <li key={line.key} className={`commentary-feed__line commentary-feed__line--${line.category}`}>
              {line.comment}
            </li>
          ))}
      </ul>
    </div>
  );
}
