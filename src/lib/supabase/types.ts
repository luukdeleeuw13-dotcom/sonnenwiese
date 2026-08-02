export type BookingStatus = "pending" | "confirmed" | "rejected";

// Rij in de Supabase-tabel `bookings` (zie supabase/migrations/0001_init.sql).
export type BookingRow = {
  id: string;
  created_at: string;
  status: BookingStatus;
  start_date: string; // yyyy-MM-dd
  end_date: string; // yyyy-MM-dd
  guests: number;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  locale: string;

  // Nota en betaling (zie 0003_payments.sql). Optioneel getypt omdat een
  // database waarin die migratie nog niet gedraaid heeft deze velden
  // helemaal niet meestuurt — dan is het `undefined`, niet `null`.
  price_cents?: number | null;
  invoice_required?: boolean;
  invoice_sent_at?: string | null;
  paid_at?: string | null;

  // De betaalcontrole (zie 0004_payment_flow.sql): wanneer de eigenaar de
  // vraag kreeg of er al betaald is, en wanneer de gast een herinnering kreeg.
  payment_check_at?: string | null;
  reminder_sent_at?: string | null;
};

// Rij in de Supabase-tabel `inquiries` (zie 0002_inquiries.sql): een vraag
// die geen boekingsaanvraag is en dus niets in de kalender blokkeert.
export type InquiryRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  period: string | null;
  message: string;
  locale: string;
  handled: boolean;
};

// Gevalideerde invoer van het vragenformulier.
export type InquiryInput = {
  fullName: string;
  email: string;
  phone?: string;
  period?: string;
  message: string;
  locale: "nl" | "de" | "en";
};

// Gevalideerde invoer van het aanvraagformulier.
export type BookingInput = {
  fullName: string;
  email: string;
  phone?: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  guests: number;
  message?: string;
  locale: "nl" | "de" | "en";
};
