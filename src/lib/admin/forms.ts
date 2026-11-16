// Wat een formulier in het beheerscherm terugkrijgt van de server. Staat
// los van actions.ts omdat een "use server"-bestand alleen functies mag
// exporteren, en het formulier in de browser dit type ook nodig heeft.
export type FormState = { ok: boolean; message: string } | null;
