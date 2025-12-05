// List of Indonesian Banks for Credit Card Selection
export interface Bank {
  id: string;
  name: string;
  code: string;
}

export const BANKS: Bank[] = [
  { id: "bca", name: "Bank Central Asia", code: "BCA" },
  { id: "blu", name: "Blu by BCA Digital", code: "BLU" },
  { id: "bni", name: "Bank Negara Indonesia", code: "BNI" },
  { id: "bri", name: "Bank Rakyat Indonesia", code: "BRI" },
  { id: "mandiri", name: "Bank Mandiri", code: "MANDIRI" },
  { id: "cimb", name: "CIMB Niaga", code: "CIMB" },
  { id: "danamon", name: "Bank Danamon", code: "DANAMON" },
  { id: "permata", name: "Bank Permata", code: "PERMATA" },
  { id: "maybank", name: "Maybank Indonesia", code: "MAYBANK" },
  { id: "hsbc", name: "HSBC Indonesia", code: "HSBC" },
  { id: "ocbc", name: "OCBC NISP", code: "OCBC" },
  { id: "uob", name: "UOB Indonesia", code: "UOB" },
  { id: "mega", name: "Bank Mega", code: "MEGA" },
  { id: "panin", name: "Panin Bank", code: "PANIN" },
  { id: "jenius", name: "Jenius (Bank BTPN)", code: "JENIUS" },
  { id: "bsi", name: "Bank Syariah Indonesia", code: "BSI" },
  { id: "digibank", name: "Digibank by DBS", code: "DIGIBANK" },
  { id: "jago", name: "Bank Jago", code: "JAGO" },
  { id: "seabank", name: "SeaBank", code: "SEABANK" },
  { id: "line", name: "LINE Bank", code: "LINE" },
  { id: "superbank", name: "Superbank", code: "SUPERBANK" },
];

// Helper to get bank by ID
export const getBankById = (id: string): Bank | undefined => {
  return BANKS.find((bank) => bank.id === id);
};

// Helper to get bank by name (fuzzy match)
export const getBankByName = (name: string): Bank | undefined => {
  const lowerName = name.toLowerCase();
  return BANKS.find(
    (bank) =>
      bank.name.toLowerCase().includes(lowerName) ||
      bank.code.toLowerCase() === lowerName
  );
};
