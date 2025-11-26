// src/api/brokers/brokerSelector.ts
import { angelOneApi } from "./angelOneApi";
import { kiteApi } from "./kiteApi";
import { cloneUserOneApi } from "./cloneUserApi";
import { fyersApi } from "./fyersApi";


export const useBrokerApi = () => {

  const userData = localStorage.getItem("user");

  const user = userData ? JSON.parse(userData) : null;

  const userRole = user?.role;
  const broker = user?.brokerName?.toLowerCase();
  const brokerImage = user?.brokerImageLink;  // ⭐ new field

  console.log(broker,userRole,'login with !');
  

  if (!broker) {
    throw new Error("Broker not selected in user data");
  }

  if (!brokerImage) console.warn("brokerImageLink missing in user data");

if (broker === "angelone"&&userRole==='user') {
    return {
      api: angelOneApi,
      image: brokerImage,
    };
  }

 if (broker === "kite"&&userRole==='user') {
    return {
      api: kiteApi,
      image: brokerImage,
    };
  }

  if (broker === "fyers"&&userRole==='user') {
    return {
      api: fyersApi,
      image: brokerImage,
    };
  }

   if (userRole=='clone-user') {
    return {
      api: cloneUserOneApi,
      image: brokerImage,
    };
  }

  throw new Error(`Unsupported broker: ${broker} and ${userRole}`);
};
