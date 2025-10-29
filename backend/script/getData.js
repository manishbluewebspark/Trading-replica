import axios from 'axios';
import { networkInterfaces } from 'os';

export async function getPublicIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error("Error fetching public IP:", error);
    return '127.0.0.1'; // Fallback
  }
}


export async function getMACAddress() {
  const interfaces = networkInterfaces();
  for (const iface in interfaces) {
    const ifaceDetails = interfaces[iface];
    for (const detail of ifaceDetails) {
      if (detail.internal === false && detail.mac) {
        return detail.mac;
      }
    }
  }
  return '00:00:00:00:00:00';
}






async function getProfileAngelOne() {

 var config = {
  method: 'get',
  url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',

  headers : {
    'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.222.213.105', 
    'X-MACAddress': '32:bd:3a:75:8f:62', 
    'X-PrivateKey': '902469ca-3abc-416a-a3e7-0d1359437ff4'
  }
};


  try {
    const response = await axios(config);
    console.log('gggt',JSON.stringify(response.data));
  } catch (error) {
    console.log('hhhy',error);
  }
}

// Call the function
// getProfileAngelOne();



async function getInstruments() {

  const data = JSON.stringify({
   "exchange": "NSE",
    "tradingsymbol": "SBIN",
    "symboltoken": "99926000"
  });

var config = {
  method: 'post',
  url: 'https://apiconnect.angelone.in/order-service/rest/secure/angelbroking/order/v1/getLtpData',
  headers: { 
    'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`,
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'X-UserType': 'USER', 
    'X-SourceID': 'WEB', 
    'X-ClientLocalIP': '127.0.0.1', 
    'X-ClientPublicIP': '106.222.213.105', 
    'X-MACAddress': '32:bd:3a:75:8f:62', 
   'X-PrivateKey': 'yJbrnnkx'
  },
  data : data
};

  try {
    const response = await axios(config);
    console.log('getInstruments',JSON.stringify(response.data));
  } catch (error) {
    console.log('hhhy',error);
  }
}

// Call the function
// getInstruments();

async function palceOrder() {

    var data = JSON.stringify({
   "variety":"NORMAL",
    "tradingsymbol":"SBIN-EQ",
    "symboltoken":"3045",
    "transactiontype":"BUY",
    "exchange":"NSE",
    "ordertype":"MARKET",
    "producttype":"INTRADAY",
    "duration":"DAY",
    "price":"194.50",
    "squareoff":"0",
    "stoploss":"0",
    "quantity":"1"
});

var config = {
  method: 'post',
  url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder',
  headers: { 
    'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`, 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'X-UserType': 'USER', 
    'X-SourceID': 'WEB', 
  'X-ClientLocalIP': '127.0.0.1', 
    'X-ClientPublicIP': '106.222.213.105', 
    'X-MACAddress': '32:bd:3a:75:8f:62', 
    'X-PrivateKey': 'yJbrnnkx'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
}

// Call the function
// palceOrder();

//  {"status":true,"message":"SUCCESS","errorcode":"","data":{"script":"SBIN-EQ","orderid":"251023001073890","uniqueorderid":"472925fb-7af8-4ed6-82ab-c544a37d3292"}}
//   {"status":true,"message":"SUCCESS","errorcode":"","data":{"script":"SBIN-EQ","orderid":"251023001073505","uniqueorderid":"8cf2d8ff-7223-4bc6-b523-dc7c597272a5"}}

// {"status":true,"message":"SUCCESS","errorcode":"","data":{"script":"SBIN-EQ","orderid":"102437eeccf8AO","uniqueorderid":"6d6be49f-ac33-40c5-b0ea-e239acf2b002"}}


async function getOrder() {

var data = '';

var config = {
  method: 'get',
  url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
  headers: { 
    'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`, 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'X-UserType': 'USER', 
    'X-SourceID': 'WEB', 
     'X-ClientLocalIP': '127.0.0.1', 
    'X-ClientPublicIP': '106.222.213.105', 
    'X-MACAddress': '32:bd:3a:75:8f:62', 
    'X-PrivateKey': 'DnoQvSij'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
    
}


// Call the function 
// getOrder()



async function getInstrumentsAllData() {

     const response = await axios.get(
      "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    );

    console.log(response.data);
    
    
}







// https://pleadingly-misshapen-wilber.ngrok-free.dev/?auth_token=eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lKaE56TTNPVFUzTmkxbFltVTBMVE0yTWpndE9HSmtZUzFsT1RFNE9EWm1OelV5TXpZaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTVRJNU1qYzFNaXdpYm1KbUlqb3hOell4TWpBMk1UY3lMQ0pwWVhRaU9qRTNOakV5TURZeE56SXNJbXAwYVNJNkltWTVNV1ppTUdZMUxUa3hPR0V0TkRFNVlpMDRNVGhsTFRKbE56TTBOakkwWVdRM05TSXNJbFJ2YTJWdUlqb2lJbjAuVlVuYzZkMDZqbHhLaHZPcVdKMHBscHNTMGFYbTdWU3hzLWdzbHpPcllDc3FJV3dabEVEQkoySGx0Yl9wNnBoUGxpN3l5MXdCWXdWODRXdXpPWkVIcHQwQ1RURHFGdlFnVF9kekowYXFRU0Z2bjlSazE0TUJRTlVQc0VRUG5peHpqWTBuNXNVWmVYQ25tWDBYWjlaSGJZc2c5aHJHLVg0ODdfTU1OU0wtNnBzIiwiQVBJLUtFWSI6IkRub1F2U2lqIiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzYxMjA2MzUyLCJleHAiOjE3NjEyNDQyMDB9.6ri4mpgntlWZVrDeGd98Pg5JcYONBpH9xGxkXUPBEjLnHZXFGjw_qdVN_c377Mmzqi9SqP7QtkzIiUGTtYVziA&feed_token=eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJpYXQiOjE3NjEyMDYzNTIsImV4cCI6MTc2MTI5Mjc1Mn0.YuKarJZ2zKYrxQX14dIIkT1dDveDM6dhulYTQ3rSJZIROWIe701azT5ZMyze1wOAL0i4rEWR9KuJjAHDvZChQA&refresh_token=eyJhbGciOiJIUzUxMiJ9.eyJ0b2tlbiI6IlJFRlJFU0gtVE9LRU4iLCJSRUZSRVNILVRPS0VOIjoiZXlKaGJHY2lPaUpTVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjFjMlZ5WDNSNWNHVWlPaUpqYkdsbGJuUWlMQ0owYjJ0bGJsOTBlWEJsSWpvaWRISmhaR1ZmY21WbWNtVnphRjkwYjJ0bGJpSXNJbWR0WDJsa0lqb3dMQ0p6YjNWeVkyVWlPaUl6SWl3aVpHVjJhV05sWDJsa0lqb2lZVGN6TnprMU56WXRaV0psTkMwek5qSTRMVGhpWkdFdFpUa3hPRGcyWmpjMU1qTTJJaXdpYTJsa0lqb2lkSEpoWkdWZmEyVjVYM1l5SWl3aWIyMXVaVzFoYm1GblpYSnBaQ0k2TUN3aWFYTnpJam9pYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrMHhOakkwTWpNaUxDSmxlSEFpT2pFM05qRXlPVEkzTlRJc0ltNWlaaUk2TVRjMk1USXdOakUzTWl3aWFXRjBJam94TnpZeE1qQTJNVGN5TENKcWRHa2lPaUpsTlRVMVlXWXdPQzAyT1RVNUxUUmtOV1V0WVRjd015MHhZekkzTVdGallXVm1NbVFpTENKVWIydGxiaUk2SWlKOS5DNEp3M2FPaGJXWFN0b25LZGprdUhWRHgydmgzLTlwMWhueHAwVERSdU96ZEZ2OVN0QWJBcUU0RG8yNjRXQlNzSjBKUFhyRDBXX2RMS2hRcmNNSHRmVWM0M2hyRUdDa05rQncyeGcwOFVTZFZpRHVDQi1ScGdoM2xRcWFtcm1WR3p3X3Z6bjQ1azVUZG10cW1OR3pRanQ5Uk13SHBfNjVDclNUbWZsbGo5Z0EiLCJpYXQiOjE3NjEyMDYzNTJ9.WlchFDfEchUjsBQ2u0gOdxFAfB6rW1yFtc-NM-_xeIxYaCrGC9mneojlmNv5WtjUF8PlKg-LhSkvVGDcSyKKXA