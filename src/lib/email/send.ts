import { Resend, type CreateEmailOptions } from "resend";

// De Resend-SDK gooit géén fout als een mail geweigerd wordt; hij geeft
// { data, error } terug. Wie alleen `await resend.emails.send(...)` doet,
// denkt dus dat het gelukt is terwijl er niets verstuurd is.
//
// Dat is precies misgegaan op 1 augustus 2026: de sandbox-afzender
// onboarding@resend.dev mag alleen naar het eigen accountadres sturen, dus
// elke eigenaarsnotificatie werd geweigerd — zonder één regel in de logs.
// Deze wrapper maakt van die stille weigering een echte fout, zodat de
// retry en het alarm in de aanroeper ook werkelijk afgaan.
export async function sendEmail(options: CreateEmailOptions) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(options);

  if (error) {
    throw new Error(
      `Resend weigerde de mail (${error.name}): ${error.message}`
    );
  }
  return data;
}
