
import axios from 'axios';



export const getPerticularInstruments = async (req, res) => {
    try {

        const reqData = JSON.stringify({
            "exchange": "NSE",
            "tradingsymbol": "SBIN-EQ",
            "symboltoken": "3045"
        });

        var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/order-service/rest/secure/angelbroking/order/v1/getLtpData',
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
        data : reqData
        };

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
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

 
       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export const getAllInstruments = async (req, res) => {
    try {
  
        const response = await axios.get(
              "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
            );

        let data =  response.data 

        // data = data.slice(0, 100000);

        return res.json({
            status: true,
            statusCode:200,
            data: data,
            message:''
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