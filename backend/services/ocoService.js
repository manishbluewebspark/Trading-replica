import OcoGroup from "../models/ocoGroupModel.js";

export async function getActiveOcoGroups() {
    
  return await OcoGroup.findAll({
    where: {
      status: "ACTIVE",
    },
    order: [["createdAt", "ASC"]],
    raw: true,
  });
}
