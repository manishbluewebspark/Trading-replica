import shoonyaClient from "./shoonyaClient.js";

import qs from "querystring";

export async function shoonyaPost(endpoint, payload) {

   const body = `jData=${JSON.stringify(payload)}`;

  const { data } = await shoonyaClient.post(endpoint, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  return data;    // usually { stat: "Ok" | "Not_Ok", ... }
}