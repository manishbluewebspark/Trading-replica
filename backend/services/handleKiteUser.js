


import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";

export const handleKiteUser = async (user, existingFund) => {
  try {

    // 1️⃣ Get authenticated Kite client for this user
    const kite = await getKiteClientForUserId(user.id);

    if (!kite) {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Kite",
        status: "NO_CREDENTIALS",
        message: "Kite access token / credentials not found for user",
        kiteFund: 0,
        pnl: 0,
      };
    }

    // 2️⃣ Get margins/funds from Kite
    const margins = await kite.getMargins(); // equity + commodity

    const equity = margins?.equity || {};
    const availableCash = Number(equity.net ?? 0);

    // 4️⃣ Return clean result for frontend
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Kite",
      status: "SUCCESS",
      angelFund: availableCash,
      pnl: 0,
      // rawMargins: margins,  // if you want to see full data in UI, you can add this
    };
  } catch (err) {
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Kite",
      status: "ERROR",
      message: err.message || "Kite fund fetch failed",
    };
  }
};