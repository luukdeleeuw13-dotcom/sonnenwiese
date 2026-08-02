import { startOfWeek } from "date-fns";

// De verhuur gaat per hele week: zaterdag 15.00 uur tot zaterdag 10.00 uur.
// Halve weken toestaan levert gaten op van drie of vier dagen die daarna
// niemand meer vult, dus de kalender laat alleen hele weken kiezen en de
// server weigert al het andere. Uitzonderingen lopen via het vragen-
// formulier, niet via het boekingsformulier.
export const CHANGEOVER_DAY = 6; // zaterdag, zoals Date#getDay het telt

// De zaterdag op of vóór deze datum: het begin van de verhuurweek waar de
// dag in valt.
export function startOfRentalWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: CHANGEOVER_DAY });
}

// Voor yyyy-MM-dd-strings, zoals ze uit het formulier en de database komen.
// Bewust in UTC gelezen: een datum zonder tijd mag niet van de tijdzone van
// de server afhangen, anders is dezelfde zaterdag in Wenen een vrijdag in
// Los Angeles.
export function isChangeoverDate(value: string): boolean {
  return new Date(`${value}T00:00:00Z`).getUTCDay() === CHANGEOVER_DAY;
}
