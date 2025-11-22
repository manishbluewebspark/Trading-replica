import {
  // ArrowDownIcon,
  ArrowUpIcon,
  // BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect,useState } from "react";

export default function EcommerceMetrics() {

  const apiUrl = import.meta.env.VITE_API_URL;

    const [userLength, setUserLength] = useState("");

  const handleGenerateToken = async () => {
    try{
          
      //    const {data} = await axios.get(
      //     `${apiUrl}/admin/login/users`,
      //     {
      //       headers: {
      //         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      //       },
      //     }
      //   );


      //   console.log(data,'admin login users');
        

      //  if(data.status==true) {
       
      //  let angel_auth_token = data.data.authToken
      // //  let angel_refresh_token = data.data.refreshToken
      // //  let angel_feed_token = data.data.feedToken

      //  localStorage.setItem("angel_token", angel_auth_token);
      // //  localStorage.setItem("angel_feed_token", angel_refresh_token);
      // //   localStorage.setItem("angel_refresh_token", angel_feed_token);

    
      //   toast.success("Login Successful in AngelOne!");

      toast.success("Currently Not Working This Button");

  
      // }else{
      //       toast.error(data.message);
      // }

       }catch(err:any) {

        toast.error(err.message);
  }
};

    // ✅ Call it automatically when component mounts
      useEffect(() => {
         
        const fetchData = async () => {


        // 2️⃣ Third API: (example)
         const getTotalUsers = await axios.get(`${apiUrl}/admin/get/totalusers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

     
      if(getTotalUsers.data.status==true) {

        setUserLength(getTotalUsers.data.data)

      }else{
          toast.error(getTotalUsers.data.message);
      }
      
  };

    fetchData();

      }, []); // empty dependency array → runs only once

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}

       {/* <!-- Metric Item Start --> */}
      {/* <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Straegies
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              5,359
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div> */}

<div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
  <div className="flex items-end justify-between mt-5"></div>

  {/* Center horizontally */}
  <div className="mt-5 flex justify-center">
    <button
     onClick={handleGenerateToken}
      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
    >
      Generate Token
    </button>
  </div>
</div>





      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
             {userLength}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>

      
      {/* <!-- Metric Item End --> */}

     

      



      {/* <!-- Metric Item End --> */}
    </div>
  );
}
