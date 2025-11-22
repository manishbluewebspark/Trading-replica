import { KiteConnect } from "kiteconnect";

export const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

// Call this after login or per request
export const setKiteAccessToken = (accessToken) => {
  kite.setAccessToken(accessToken);
};