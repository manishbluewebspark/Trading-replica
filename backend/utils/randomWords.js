import crypto from "crypto";

export function generateRandomWords() {

  const word = crypto.randomBytes(3).toString("hex");

  return word;
  
}

