import crypto from "crypto";

export function generateRandomNumbers(length) {
  // generate a random integer string of desired length (digits only)
  const digits = crypto.randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return digits;
}

