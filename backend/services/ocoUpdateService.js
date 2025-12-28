// services/ocoService.js
import OcoGroup from "../models/ocoGroupModel.js";


export async function markOcoCompleted(ocoId, winner) {
  await OcoGroup.update(
    {
      status: "COMPLETED",
      winner, // "TARGET" or "STOPLOSS"
    },
    {
      where: { id: ocoId },
    }
  );
}