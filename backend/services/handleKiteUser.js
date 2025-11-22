
import { setKiteAccessToken, kite } from "../utils/kiteClient.js";
import FundPNL from "../models/angelFundAndPNL.js"

export const handleKiteUser = async (user, existingFund) => {
  try {
   
    // 🔐 Set token for this user
    await setKiteAccessToken(user.authToken);

    // 📌 Fetch Fund
    const margins = await kite.getMargins();

    const fund = margins?.equity?.net || 0;

    const [fundRow] = await FundPNL.findOrCreate({
      where: { userId: user.id },
      defaults: { fund, pnl: 0, authToken: user.authToken },
    });

    await fundRow.update({ fund, pnl: 0,authToken: user.authToken });

    return {
      userId: user.id,
       username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
      brokerName: "Kite",
      status: "SUCCESS",
      angelFund: fund,
      pnl: 0,
    };

  } catch (err) {
    return {
      userId: user.id,
       username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
      brokerName: "Kite",
      status: "ERROR",
      message: err.message,
    };
  }
};
