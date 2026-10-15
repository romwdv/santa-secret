export type Participant = {
  id: string;
  firstName: string;
  initials: string;
};

export type WishlistItem = {
  id: string;
  participantId: string;
  title: string;
  /** Facultatif : une idée peut être décrite sans lien. */
  url: string | null;
};

export type Draw = {
  giverId: string;
  recipient: Participant;
};