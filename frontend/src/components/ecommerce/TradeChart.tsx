import {
  // ArrowUpIcon,
  // GroupIcon,
} from "../../icons";
// import Badge from "../ui/badge/Badge";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function TradeChart() {


  const apiUrl = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

  const [totalTrades, setTotalTrades] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {data} = await axios.get(`${apiUrl}/admin/get/recent/order`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

       

          if(data.status==true) {
        
          const result = data;
          setTotalTrades(result.totalSellTrades || 0);
          setTotalOpen(result.totalOpenPositions || 0);
        
             }else if(data.status==false&&data.message=='Unauthorized'){

               localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
        
               navigate("/");
        
                    
             }else{
                    toast.error(data.error);    
             }
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    fetchData();
  }, []);

  return (
   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">

    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
       

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Trade
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
             {totalTrades}
            </h4>
          </div>
          
        </div>
      </div>

   
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        

        <div className="flex items-end justify-between mt-8">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Open
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
             {totalOpen}
            </h4>
          </div>
         
        </div>
      </div>

    </div>
  );
}
