// utils/fyersClient.js
import { fyersModel as FyersAPI } from "fyers-api-v3";

const fyers = new FyersAPI();

// Configure static app data from env
fyers.setAppId(process.env.fyers_app_id);
fyers.setRedirectUrl(process.env.fyers_redirect_uri);

/**
 * Set per-user access token before every call
 */
export const setFyersAccessToken = async (accessToken) => {
  if (!accessToken) {
    throw new Error("No Fyers access token provided");
  }
  fyers.setAccessToken(accessToken);
};

export { fyers };
