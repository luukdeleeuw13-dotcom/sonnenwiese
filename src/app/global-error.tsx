"use client";

// Laatste vangnet: dit vuurt alleen als de locale-layout zelf omvalt, dus
// vóórdat vertalingen en de huisstijl geladen zijn. Daarom bewust
// Nederlands en met inline stijlen — hier valt niets meer op terug te vallen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf6ee",
          color: "#4a3728",
          fontFamily: "Helvetica, Arial, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px" }}>
            Er ging iets mis
          </h1>
          <p style={{ maxWidth: "34em", lineHeight: 1.6 }}>
            De site kon even niet geladen worden. Probeer het opnieuw — blijft
            het misgaan, mail ons dan gerust, dan regelen we je aanvraag
            persoonlijk.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              border: 0,
              borderRadius: "8px",
              backgroundColor: "#d98e46",
              color: "#fff",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
          {error.digest && (
            <p style={{ marginTop: "24px", fontSize: "12px", opacity: 0.6 }}>
              Foutcode: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
