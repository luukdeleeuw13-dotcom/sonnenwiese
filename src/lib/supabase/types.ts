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
