// src/api/brokers/brokerSelector.ts
import { angelOneApi } from "./angelOneApi";
import { kiteApi } from "./kiteApi";
import { cloneUserOneApi } from "./cloneUserApi";
import { fyersApi } from "./fyersApi";
import {finvasiaApi} from "./finvasiaApi"
import {upStoxApi} from "./upStoxApi"

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
      brokerName:broker

    };
  }

 if (broker === "kite"&&userRole==='user') {
    return {
      api: kiteApi,
      image: brokerImage,
       brokerName:broker
    };
  }

  if (broker === "fyers"&&userRole==='user') {
    return {
      api: fyersApi,
      image: brokerImage,
       brokerName:broker
    };
  }

   if (broker === "upstox"&&userRole==='user') {
    return {
      api: upStoxApi,
      image: brokerImage,
       brokerName:broker
    };
  }

   if (broker === "finvasia"&&userRole==='user') {
    return {
      api: finvasiaApi,
      image: brokerImage,
       brokerName:broker
    };
  }

   if (userRole=='clone-user') {
    return {
      api: cloneUserOneApi,
      image: brokerImage,
       brokerName:broker
    };
  }

  throw new Error(`Unsupported broker: ${broker} and ${userRole}`);
};
