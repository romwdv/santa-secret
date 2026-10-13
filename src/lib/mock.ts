import type { WishlistItem } from "@/components/card";

export type Participant = {
  id: string;
  firstName: string;
  initials: string;
};

export type Draw = {
  id: string;
  recipient: Participant;
};

export const currentUser: Participant = {
  id: "faustine",
  firstName: "Faustine",
  initials: "FS",
};

export const mockParticipants: Participant[] = [
  currentUser,
  { id: "mehdi", firstName: "Mehdi", initials: "ME" },
  { id: "lea", firstName: "Léa", initials: "LE" },
  { id: "antoine", firstName: "Antoine", initials: "AN" },
  { id: "sarah", firstName: "Sarah", initials: "SA" },
  { id: "yann", firstName: "Yann", initials: "YA" },
];

export const mockDraw: Draw = {
  id: "draw-2026",
  recipient: mockParticipants[2],
};

export const mockWishlist: WishlistItem[] = [
  { id: "w1", title: "Bougie senteur sapin", url: "http://mabougie.com" },
  { id: "w2", title: "Chocolat noir 70%", url: "http://chocolat.com" },
  { id: "w3", title: "Livre de cuisine", url: "http://livre.com" },
  { id: "w4", title: "Mug isotherme", url: "http://mug.com" },
];

export function getSession() {
  return currentUser;
}