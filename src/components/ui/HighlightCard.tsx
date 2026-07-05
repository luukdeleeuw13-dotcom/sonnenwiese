// Klein kaartje met icoon + titel + tekst, voor de kernpunten op Home.
// Met optionele href wordt het hele kaartje een (onopvallende) externe link.
export default function HighlightCard({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-meadow/15 text-meadow-dark">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-bark">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-timber">{text}</p>
    </>
  );

  const className = "rounded-card border border-sand bg-snow p-5";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} block`}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}
