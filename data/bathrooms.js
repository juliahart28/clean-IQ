
export let bathrooms = [
  { id: 1, name: "First Floor East",  numUses: 3, soapLevel: "ok",    toiletPaperLevel: "low" },
  { id: 2, name: "Second Floor West", numUses: 7, soapLevel: "empty", toiletPaperLevel: "ok"  },
  { id: 3, name: "Main Lobby",        numUses: 1, soapLevel: "ok",    toiletPaperLevel: "ok"  }
];

export function resetBathroom(id) {
  const b = bathrooms.find(x => x.id === id);
  if (!b) return null;
  b.numUses = 0;
  b.soapLevel = "ok";
  b.toiletPaperLevel = "ok";
  return b;
}
