
import axios from 'axios';
import { getIO } from "../socket/index.js";
import Order from '../models/orderModel.js';
import dayjs from "dayjs";
import { getManyTokensFromSession } from '../utils/sessionUtils.js';
import {emitOrderGet} from "../services/smartapiFeed.js"

import { Sequelize, Op } from "sequelize";

let saveData = [
    {
      "userId":"5",  
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "EOS",
      "price": 383.1,
      "triggerprice": 0,
      "quantity": "20",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "SENSEX25N0684700CE",
      "transactiontype": "BUY",
      "exchange": "BFO",
      "symboltoken": "889009",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 84700,
      "optiontype": "CE",
      "expirydate": "06NOV2025",
      "lotsize": "20",
      "cancelsize": "0",
      "averageprice": 374.25,
      "filledshares": "20",
      "unfilledshares": "0",
      "orderid": "251031000042117",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:20:28",
      "exchtime": "31-Oct-2025 09:20:28",
      "exchorderupdatetime": "31-Oct-2025 09:20:28",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_3e540a47-705a-4c70-9169-929b84731436",
      "exchangeorderid": "1761882300005569068"
    },
     {
     "userId":"5",  
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "EOS",
      "price": 336.9,
      "triggerprice": 0,
      "quantity": "20",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "SENSEX25N0684700CE",
      "transactiontype": "SELL",
      "exchange": "BFO",
      "symboltoken": "889009",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 84700,
      "optiontype": "CE",
      "expirydate": "06NOV2025",
      "lotsize": "20",
      "cancelsize": "0",
      "averageprice": 345.55,
      "filledshares": "20",
      "unfilledshares": "0",
      "orderid": "251031000047021",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:21:06",
      "exchtime": "31-Oct-2025 09:21:06",
      "exchorderupdatetime": "31-Oct-2025 09:21:06",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_d861f618-0c01-4b96-91cd-6a21b3a26648",
      "exchangeorderid": "1761882300005759848"
    },

    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 34,
    //   "triggerprice": 0,
    //   "quantity": "400",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "UNITDSPR25NOV251480CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "126980",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 1480,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "400",
    //   "cancelsize": "400",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "400",
    //   "orderid": "251031000060940",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 09:25:26",
    //   "exchtime": "31-Oct-2025 09:24:54",
    //   "exchorderupdatetime": "31-Oct-2025 09:25:26",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_16e2aabb-b135-4ad9-9cae-ee5abc06dfa9",
    //   "exchangeorderid": "2600000008389520"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "EOS",
    //   "price": 450,
    //   "triggerprice": 0,
    //   "quantity": "20",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "SENSEX25N0684800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "BFO",
    //   "symboltoken": "888770",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 84800,
    //   "optiontype": "CE",
    //   "expirydate": "06NOV2025",
    //   "lotsize": "20",
    //   "cancelsize": "20",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "20",
    //   "orderid": "251031000109592",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 09:36:00",
    //   "exchtime": "31-Oct-2025 09:35:41",
    //   "exchorderupdatetime": "31-Oct-2025 09:36:00",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_bb9a624c-9957-40fa-938f-8182d03b1459",
    //   "exchangeorderid": "1761883333755659772"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 69.55,
    //   "triggerprice": 0,
    //   "quantity": "175",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "EICHERMOT25NOV257400CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "80770",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 7400,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "175",
    //   "cancelsize": "0",
    //   "averageprice": 69.55,
    //   "filledshares": "175",
    //   "unfilledshares": "0",
    //   "orderid": "251031000152014",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 09:50:14",
    //   "exchtime": "31-Oct-2025 09:50:04",
    //   "exchorderupdatetime": "31-Oct-2025 09:50:14",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_83c91df1-e6ef-4772-8e95-f974faccb0f0",
    //   "exchangeorderid": "2400000027669013"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 68,
    //   "triggerprice": 0,
    //   "quantity": "175",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "EICHERMOT25NOV257400CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "80770",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 7400,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "175",
    //   "cancelsize": "0",
    //   "averageprice": 70.1,
    //   "filledshares": "175",
    //   "unfilledshares": "0",
    //   "orderid": "251031000154288",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 09:50:58",
    //   "exchtime": "31-Oct-2025 09:50:58",
    //   "exchorderupdatetime": "31-Oct-2025 09:50:58",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_6997d705-a6f1-47ff-b06b-80c4a5a02e69",
    //   "exchangeorderid": "2400000028191028"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 84,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000167938",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 09:57:30",
    //   "exchtime": "31-Oct-2025 09:57:19",
    //   "exchorderupdatetime": "31-Oct-2025 09:57:30",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_fb80e8c6-9eb2-4f6b-8feb-30800d7d0f76",
    //   "exchangeorderid": "2200000027404941"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 84,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "0",
    //   "averageprice": 84,
    //   "filledshares": "150",
    //   "unfilledshares": "0",
    //   "orderid": "251031000168552",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 09:57:47",
    //   "exchtime": "31-Oct-2025 09:57:42",
    //   "exchorderupdatetime": "31-Oct-2025 09:57:47",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_fa5297cb-fa51-4741-ae42-616bfe82d3a9",
    //   "exchangeorderid": "2200000027651424"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 88,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000169204",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 09:59:17",
    //   "exchtime": "31-Oct-2025 09:58:05",
    //   "exchorderupdatetime": "31-Oct-2025 09:59:17",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_e85ab3d6-e4cd-41e8-8ed9-a66fe380d33d",
    //   "exchangeorderid": "2200000027888610"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 87,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000171566",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 10:02:42",
    //   "exchtime": "31-Oct-2025 09:59:17",
    //   "exchorderupdatetime": "31-Oct-2025 10:02:42",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_2ee14068-10de-49ab-8060-d776c2969420",
    //   "exchangeorderid": "2200000028581378"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 84,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000183699",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 10:03:34",
    //   "exchtime": "31-Oct-2025 10:02:43",
    //   "exchorderupdatetime": "31-Oct-2025 10:03:34",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_1137f9fd-be68-47e3-afbd-22894c00e880",
    //   "exchangeorderid": "2200000030627454"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 83,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000189184",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 10:04:56",
    //   "exchtime": "31-Oct-2025 10:04:45",
    //   "exchorderupdatetime": "31-Oct-2025 10:04:56",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_9c3418de-f4dd-4bd6-bc35-4025bcfa22b8",
    //   "exchangeorderid": "2200000031761317"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 86,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000189842",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 10:06:38",
    //   "exchtime": "31-Oct-2025 10:06:04",
    //   "exchorderupdatetime": "31-Oct-2025 10:06:38",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_b47a42ba-2a4b-41e9-b577-13814b5d35be",
    //   "exchangeorderid": "2200000031865485"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 81,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "HAL25NOV254850CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "104704",
    //   "ordertag": "",
    //   "instrumenttype": "OPTSTK",
    //   "strikeprice": 4850,
    //   "optiontype": "CE",
    //   "expirydate": "25NOV2025",
    //   "lotsize": "150",
    //   "cancelsize": "0",
    //   "averageprice": 81,
    //   "filledshares": "150",
    //   "unfilledshares": "0",
    //   "orderid": "251031000195692",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 10:07:18",
    //   "exchtime": "31-Oct-2025 10:07:13",
    //   "exchorderupdatetime": "31-Oct-2025 10:07:18",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_3aaf8959-89a5-42a5-8fe6-d4bbd0aab5b1",
    //   "exchangeorderid": "2200000032866021"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 168.8,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 167,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000233227",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 10:20:52",
    //   "exchtime": "31-Oct-2025 10:20:52",
    //   "exchorderupdatetime": "31-Oct-2025 10:20:52",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_08096040-ab29-4b94-a62c-7c221525885c",
    //   "exchangeorderid": "1500000052194376"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 129.75,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 132.55,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000280530",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 10:38:51",
    //   "exchtime": "31-Oct-2025 10:38:51",
    //   "exchorderupdatetime": "31-Oct-2025 10:38:51",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "999ee463-cbc5-40b4-99e7-a0408b9883eb",
    //   "exchangeorderid": "1500000065872884"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 140.15,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 136.25,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000286625",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 10:42:22",
    //   "exchtime": "31-Oct-2025 10:42:22",
    //   "exchorderupdatetime": "31-Oct-2025 10:42:22",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_9ad7f0a6-498b-4003-ab15-38549b0641d5",
    //   "exchangeorderid": "1500000067793963"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 108,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 108,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000468687",
    //   "text": "order is not open",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 14:16:31",
    //   "exchtime": "31-Oct-2025 14:14:01",
    //   "exchorderupdatetime": "31-Oct-2025 14:15:20",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_61caae72-9b21-4a6a-9125-a101d039f149",
    //   "exchangeorderid": "1500000144911488"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 104.6,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 106.95,
    //   "filledshares": "150",
    //   "unfilledshares": "0",
    //   "orderid": "251031000597727",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 14:36:39",
    //   "exchtime": "31-Oct-2025 14:36:39",
    //   "exchorderupdatetime": "31-Oct-2025 14:36:39",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "d95ee818-895f-44d3-a7e3-9010ec7a574f",
    //   "exchangeorderid": "1500000209280169"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 102.45,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "75",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "75",
    //   "orderid": "251031000598649",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 14:41:08",
    //   "exchtime": "31-Oct-2025 14:40:57",
    //   "exchorderupdatetime": "31-Oct-2025 14:41:08",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_b7685c65-dce5-413a-b426-2f0abbade763",
    //   "exchangeorderid": "1500000209689672"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 108.45,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 108.45,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000604726",
    //   "text": "order is not open",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 14:43:55",
    //   "exchtime": "31-Oct-2025 14:43:19",
    //   "exchorderupdatetime": "31-Oct-2025 14:43:39",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_e59158b9-78eb-4d89-823d-08fbf697fd20",
    //   "exchangeorderid": "1500000213078928"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 98,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "75",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "75",
    //   "orderid": "251031000608927",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 14:50:32",
    //   "exchtime": "31-Oct-2025 14:47:31",
    //   "exchorderupdatetime": "31-Oct-2025 14:50:32",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_da518dff-edf8-43e1-91fe-c4d7b813aea3",
    //   "exchangeorderid": "1500000215189261"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 107.25,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 104.55,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000617109",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 14:55:36",
    //   "exchtime": "31-Oct-2025 14:55:36",
    //   "exchorderupdatetime": "31-Oct-2025 14:55:36",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_d1ecb798-765b-4249-bd7e-535dab6fbd35",
    //   "exchangeorderid": "1500000219008762"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 95.3,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 97.9,
    //   "filledshares": "150",
    //   "unfilledshares": "0",
    //   "orderid": "251031000626669",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:01:14",
    //   "exchtime": "31-Oct-2025 15:01:14",
    //   "exchorderupdatetime": "31-Oct-2025 15:01:14",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "080d2ff8-ad12-42ef-92f4-bfea166f9716",
    //   "exchangeorderid": "1500000223368501"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 60,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525750PE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47669",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25750,
    //   "optiontype": "PE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "75",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "75",
    //   "orderid": "251031000628320",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 15:02:21",
    //   "exchtime": "31-Oct-2025 15:02:02",
    //   "exchorderupdatetime": "31-Oct-2025 15:02:21",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_adc01b41-1444-4ee1-a628-3a744fb03d82",
    //   "exchangeorderid": "1400000207831454"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 103.6,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 101.35,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000629320",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:02:47",
    //   "exchtime": "31-Oct-2025 15:02:47",
    //   "exchorderupdatetime": "31-Oct-2025 15:02:47",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_d97dadbe-8b47-407f-8173-720153c8e550",
    //   "exchangeorderid": "1500000224277403"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 100,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 100,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000637909",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:09:27",
    //   "exchtime": "31-Oct-2025 15:09:20",
    //   "exchorderupdatetime": "31-Oct-2025 15:09:27",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_42c5a8ad-05ff-4cf2-a53d-cabe6f58418d",
    //   "exchangeorderid": "1500000227875389"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 99,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 99,
    //   "filledshares": "150",
    //   "unfilledshares": "0",
    //   "orderid": "251031000643602",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:13:37",
    //   "exchtime": "31-Oct-2025 15:13:35",
    //   "exchorderupdatetime": "31-Oct-2025 15:13:37",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_41a0aaef-6f8b-419b-b261-7fd42688f55f",
    //   "exchangeorderid": "1500000230021228"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "LIMIT",
    //   "producttype": "INTRADAY",
    //   "duration": "DAY",
    //   "price": 100,
    //   "triggerprice": 0,
    //   "quantity": "150",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "150",
    //   "averageprice": 0,
    //   "filledshares": "0",
    //   "unfilledshares": "150",
    //   "orderid": "251031000655098",
    //   "text": "",
    //   "status": "cancelled",
    //   "orderstatus": "cancelled",
    //   "updatetime": "31-Oct-2025 15:19:26",
    //   "exchtime": "31-Oct-2025 15:19:18",
    //   "exchorderupdatetime": "31-Oct-2025 15:19:26",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_2e759b09-4bd8-426e-b5ec-ac3a1168e12c",
    //   "exchangeorderid": "1500000233020808"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "CARRYFORWARD",
    //   "duration": "DAY",
    //   "price": 109.95,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "BUY",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 107.3,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000657303",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:21:23",
    //   "exchtime": "31-Oct-2025 15:21:23",
    //   "exchorderupdatetime": "31-Oct-2025 15:21:23",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "AAAD833605_8362df41-6b0b-493f-9155-f2df7c6d3120",
    //   "exchangeorderid": "1500000233770216"
    // },
    // {
    //   "variety": "NORMAL",
    //    "userId":"1",  
    //   "ordertype": "MARKET",
    //   "producttype": "CARRYFORWARD",
    //   "duration": "DAY",
    //   "price": 104.1,
    //   "triggerprice": 0,
    //   "quantity": "75",
    //   "disclosedquantity": "0",
    //   "squareoff": 0,
    //   "stoploss": 0,
    //   "trailingstoploss": 0,
    //   "tradingsymbol": "NIFTY04NOV2525800CE",
    //   "transactiontype": "SELL",
    //   "exchange": "NFO",
    //   "symboltoken": "47670",
    //   "ordertag": "",
    //   "instrumenttype": "OPTIDX",
    //   "strikeprice": 25800,
    //   "optiontype": "CE",
    //   "expirydate": "04NOV2025",
    //   "lotsize": "75",
    //   "cancelsize": "0",
    //   "averageprice": 106.55,
    //   "filledshares": "75",
    //   "unfilledshares": "0",
    //   "orderid": "251031000666869",
    //   "text": "",
    //   "status": "complete",
    //   "orderstatus": "complete",
    //   "updatetime": "31-Oct-2025 15:27:59",
    //   "exchtime": "31-Oct-2025 15:27:59",
    //   "exchorderupdatetime": "31-Oct-2025 15:27:59",
    //   "fillid": "",
    //   "filltime": "",
    //   "parentorderid": "",
    //   "uniqueorderid": "14a8282e-2c24-47b4-959d-cd9e0ac5895c",
    //   "exchangeorderid": "1500000236295594"
    // }
  ]

 const saveOrderData = async function () {
      
       await Order.bulkCreate(saveData, { ignoreDuplicates: true });

       console.log('save trade data',saveData.length);
       
  } 


// saveOrderData()



export const getOrderPerticular = async (req, res,next) => {
    try {

        let orderId = "7d87d261-7c7d-4e55-a8bd-67ce2e179634"

        let token ='eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell5TURRek5UazBMQ0p1WW1ZaU9qRTNOakU1TlRjd01UUXNJbWxoZENJNk1UYzJNVGsxTnpBeE5Dd2lhblJwSWpvaVlUSm1aREZsTmpBdFlqYzJZUzAwT0dVNExUZ3hOekV0WVRjeE1qZGpPVFF5T0dObElpd2lWRzlyWlc0aU9pSWlmUS5ybHFzLTk3QUVoZ2NwMDhhOWtRM2VMdkhNMmVaREVMRERlMzNCTXFUT1dFN2dIRDFvUktHcVZ2a1hkSnBIc1ZmLVphaWxIZ3JKcU5CejA2Zm00NDg5XzBGN0hCVEN3QU1US25IN3YxNFF6aDlkVFdfTVZPckx2VEtxckNiVTBFRFNhQ05JUm5IX2pqdmxkWXJWb2Y0ZElId0xFNU0wcktJbWY1eFhVVnRpZm8iLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjE5NTcxOTQsImV4cCI6MTc2MjAyMTgwMH0.EHrnDiNaQEmlkvpexlJC04iz3yazrlaq84f6EQlkLpnh2Ae-2Bmj7W5a5O8Cm_UezeC_5YfSBO6YgTVC1X1Wbg'
       
        var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${orderId}`,
        headers: { 
       'X-PrivateKey': process.env.PRIVATE_KEY, 
      'Accept': 'application/json', 
      'X-SourceID': 'WEB', 
    'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
       'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
       'X-MACAddress': process.env.MAC_Address, 
      'X-UserType': 'USER', 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    },
        };

        let {data} = await axios(config)

        console.log(data);
        

        if(data.status==true) {
  
            return res.json({
            status: true,
            statusCode:200,
           data: data?.data ?? [],
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

    } catch (error) {

        console.log(error);
        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};



//   WOKRING 
export const getOrder = async (req, res,next) => {
    try {

    
        var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
        headers: { 
           'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
      
        };

        let {data} = await axios(config)

         emitOrderGet(data.data)

        if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
           data: data?.data ?? [],
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

    } catch (error) {


        console.log(error);
        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

export const getOrderWithDate = async (req, res,next) => {
    try {
 
       if(req.body===undefined) {
           
         return res.json({
            status: false,
            statusCode:401,
            message: "Select Date",
            data:null,
            error:"Select Date",
        });

       }

        let fromDate = dayjs(req.body[0]);
        let toDate = dayjs(req.body[1]);

        fromDate  = new Date(fromDate)
        toDate = new Date(toDate)

        toDate.setDate(toDate.getDate() + 1);
         fromDate.setDate(fromDate.getDate() + 1);

        console.log(fromDate,toDate);
        

        const data = await Order.findAll({
      where: Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("createdAt")),
        {
          [Op.between]: [fromDate, toDate] // e.g. "2025-11-07" to "2025-11-13"
        }
      ),
      order: [["createdAt", "ASC"]],
      raw: true,
    });

        

        console.log(data,'hhhy data');
        
         


            return res.json({
            status: true,
            statusCode:200,
           data: data ,
            message:'get data'
        });
        

      


          

        

    } catch (error) {

        console.log(error);
        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};



// WOKRING
export const ModifyOrder = async (req, res,next) => {
   try{

     var data = JSON.stringify(req.body);

     console.log(data);
     

    var config = {
    method: 'post',
    url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder',
    headers: { 
      'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'X-UserType': 'USER', 
        'X-SourceID': 'WEB', 
       'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };

      let resData = await axios(config)

       if(resData.data.status==true){

    // normalize if needed
    const where = { orderid: req.body.orderid };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
     req.body,
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order not Found in PG DB and Update in Angel Account",
            data:null,
            error: "Order not Found in PG DB and Update in Angel Account",
        });     
    }
        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message:'Order is Updated'
    });

    }else{
        
     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Update",
        });     

    }
      	
   }catch(error){
       
     return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

   }

}

//   WOKRING   give a verity fields in fornted when user is cancel 
export const cancelOrder = async (req, res,next) => {
   
    try {

    var data = JSON.stringify({
    //   "variety":req.body.variety,
     "variety":req.body.variety,
      "orderid":req.body.orderid
    });
    

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };
    
    let resData = await axios(config)

    if(resData.data.status==true){

        // normalize if needed
    const where = { orderid: req.body.orderid };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
      {
        status: 'cancelled',        // or 'canceled' if you prefer US spelling
        orderstatus: 'cancelled',
      },
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order is Cancell and Not Update in PG DB With Cancell Status",
            data:null,
            error: "Order is Cancell and Not Update in PG DB With Cancell Status",
        });     
    }
        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: 'Order Cancell Successfully'
    });

    }else{

     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Calcell",
        });     

    }

    } catch (error) {

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

//   WOKRING 
export const placeOrder = async (req, res,next) => {
    
    try {
      
        const saveObj = {
            userId:req.userId,    
            variety: req.body.variety,
            tradingsymbol: req.body.symbol,
            symboltoken: req.body.token,
            transactiontype: req.body.transactiontype,
            exchange: req.body.exch_seg,
            ordertype: req.body.orderType,
            producttype: req.body.producttype || "INTRADAY",
            duration: req.body.duration || "DAY",
            price: req.body.price,
            productType:req.body.productType,
            totalPrice:req.body.totalPrice,
            actualQuantity:req.body.actualQuantity,
            squareoff: "0",
            stoploss: "0",
            quantity: req.body.quantity,
            };

        // 1. Store pending order
        const newOrder = await Order.create(saveObj);

        var config = {
            method: 'post',
            url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder',
            headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
            },
            data : JSON.stringify(saveObj)
        };

    let response = await axios(config)

    const total = 190

    getIO().to("orders").emit("orders:count", {total});

    // 4️⃣ Handle API response
    if (response.data?.status === true) {

       let uniqueOrderId =  response?.data?.data?.uniqueorderid ||null
    
        var configStatus = {
            method: 'get',
            url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`,
            headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
            },
        };   
        
    let responseStatus = await axios(configStatus)

          // 4️⃣ Handle API response
    if (responseStatus.data?.status === true) {
    
    await newOrder.update(responseStatus.data.data);

        // 3️⃣ Fetch trade book AFTER order details success
        const tradeCfg = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: {
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP,
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP,
            'X-MACAddress': process.env.MAC_Address,
            'X-PrivateKey': process.env.PRIVATE_KEY,
        },
    };

        const tradeRes = await axios(tradeCfg);

        if(tradeRes.data.status===true&&tradeRes.data.data!==null) {

        const orderId = response?.data?.data?.orderid || null;

        // AngelOne often returns { status, data: [ ...trades ] } or { data: { data: [ ... ] } }
        const tradeList = tradeRes?.data?.data

        // find an uniqueId with traded Object 
        const matchedTrade = tradeList.find((t) => t.orderid === orderId);

         // Update Values in Order Schema 
        const fillsize      = matchedTrade.fillsize
        const fillid  =  matchedTrade.fillid
        const fillprice      = matchedTrade.fillprice
        const tradevalue  =  matchedTrade.tradevalue
        const filltime  =  matchedTrade.filltime

        // ✅ Update exactly FIVE fields in PG
            await newOrder.update({
            tradedValue: tradevalue,
            fillprice: fillprice,
            fillsize:     fillsize,
            filltime:     filltime,
            fillid:       fillid,
            });
        
      return res.json({
        status: true,
        statusCode:200,
        message: "Order placed successfully",
        data: response.data.data,
      });


        }else if(tradeRes.data.status===true&&tradeRes.data.data===null) {

             return res.json({
                status: true,
                statusCode:200,
                message: "Order placed successfully But Status is Open",
                data: null,
                });

        }else{

              return res.json({
                status: true,
                statusCode:200,
                message: "Order placed successfully But Traded Value and Time not Update",
                data: null,
                });  

        }

    }else{
           
    return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: "Order is Place But Not Update Status in PG DB ",
    })
            
    }

    } else {

               // normalize if needed
    const where = { id: newOrder.id };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
      {
        status: 'cancelled',        // or 'canceled' if you prefer US spelling
      },
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order not found in PG DB and Order is not Placed",
            data:null,
            error: "Order not found in PG DB and Order is not Placed",
        });     
    }
        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: " Order is not Placed and Order status update in PG DB Cancell",
    })

    }

    } catch (error) {


        console.log(error);
        

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

export const getOrderInTables = async (req, res,next) => {
    try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);


  const orderData = await Order.findAll({
      where: {
        userId:req.userId,
         createdAt: {
      [Op.between]: [startOfDay, endOfDay], // 👈 Only today’s data
    },
      },
      order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
      raw: true,
    });
    
     return res.json({
          status: true,
          statusCode:200,
          data:orderData,
          message:'get data'
      });
    
    
    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


//   WOKRING 
export const getLTP = async (req, res,next) => {
    try {

       var data = JSON.stringify({
            "exchange":req.body.exchange,
            "tradingsymbol":req.body.tradingsymbol,
            "symboltoken":req.body.symboltoken
        });

      var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData',

        headers: { 
             'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        data : data
    };

    let resData = await axios(config)

     if(resData?.data?.status==true) {

         return res.json({
            status: true,
            statusCode:200,
            data: resData.data,
            message:''
        });
     }else{
       
        return res.json({
            status: false,
            statusCode:401,
            message: "Invalid symboltoken",
            error: resData?.data?.message,
        });

     }

    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};












