// import { FormEvent, useState,useEffect } from "react";
// import { Link } from "react-router";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
// import axios from "axios";
// import { toast } from "react-toastify";
// // import Button from "../ui/button/Button";
// import { useNavigate } from "react-router";

// export default function SignUpForm() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [broker, setBroker] = useState("");
//   const [email, setEmail] = useState("");
//   const [mob, setMob] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//   const [isChecked, setIsChecked] = useState(() => {
//     return JSON.parse(localStorage.getItem("termsAccepted") || "false");
//   });

//   const [brokers, setBrokers] = useState([]);

//   useEffect(() => {

   
    
//   const fetchBrokers = async () => {
//     try {

      

//       const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

    
      
//       if (res.data.status) {
//         setBrokers(res.data.data);
//       }
//     } catch (err) {

     
      
//       toast.error("Failed to load brokers");
//     }
//   };
//   fetchBrokers();
// }, []);


//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     if (!isChecked) {
//       toast.error("Please accept the Terms and Conditions before signing up.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await axios.post(`${apiUrl}/auth/register`, {
//         firstName: firstName.trim(),
//         lastName: lastName.trim(),
//         email: email.trim(),
//         mob: mob,
//         password: password,
//         isChecked: isChecked,
//         broker: broker,
//       });

//       if (response.data.status === true) {
//         toast.success("User registered successfully!");

//         setFirstName("");
//         setLastName("");
//         setEmail("");
//         setMob("");
//         setPassword("");
//         setBroker("");
//         setIsChecked(false);

//         localStorage.setItem("token", response?.data?.token);
//         localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));

//         navigate("/dashboard");
//       } else {
//         toast.error(response.data.message);
//       }
//     } catch (error: any) {
//       toast.error(
//         error.response?.data?.message ||
//           "Something went wrong. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-white">

// {/* LEFT SIDE WITH BG IMAGE + LOGO */}
// <div className="hidden lg:flex w-[45%] p-4">
  
//   <div
//     className="flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat relative rounded-2xl w-full h-full p-6"
//     style={{
//       backgroundImage: "url('/Login.jpeg')",
//     }}
//   >
//     {/* LOGO */}
//         <img
//           src="/logo1.svg"
//           alt="Logo"
//           className="absolute z-10 w-48 top-125"
//         />
//   </div>
// </div>


//       {/* RIGHT SIDE SIGNUP FORM */}
//       <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-[55%] px-6">
//         <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">

//           <div className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Sign Up
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Enter your details to create your account.
//             </p>
//           </div>

//           <form onSubmit={handleSubmit}>
//             <div className="space-y-5">

//               {/* Names */}
//               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                 <div>
//                   <Label>First Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter first name"
//                     value={firstName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label>Last Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter last name"
//                     value={lastName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Email */}
//               <div>
//                 <Label>Email<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>

//               {/* Mobile */}
//               <div>
//                 <Label>Mobile<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="number"
//                   placeholder="Enter mobile number"
//                   value={mob}
//                   onChange={(e) => setMob(e.target.value)}
//                   required
//                 />
//               </div>

//               {/* Broker */}
//               {/* <div>
//                 <Label>Broker<span className="text-error-500">*</span></Label>
//                 <select
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
//                   value={broker}
//                   onChange={(e) => setBroker(e.target.value)}
//                   required
//                 >
//                   <option value="">Select Broker</option>
//                   <option value="Angelone">Angelone</option>
//                   <option value="5Paisa">5Paisa</option>
//                   <option value="AliceBlue">AliceBlue</option>
//                   <option value="Binance">Binance</option>
//                   <option value="BitBns">BitBns</option>
//                   <option value="kite">Kite</option>
//                    <option value="finvasia">Finvasia</option>
//                   <option value="fyers">Fyers</option>
//                   <option value="groww">Groww</option>
//                     <option value="upstox">UpStox</option>
//                 </select>
//               </div> */}
//               <div>
//   <Label>Broker<span className="text-error-500">*</span></Label>
//   <select
//     className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
//     value={broker}
//     onChange={(e) => setBroker(e.target.value)}
//     required
//   >
//     <option value="">Select Broker</option>
//     {brokers.map((b: any) => (
//       <option key={b.id} value={b.brokerName}>
//         {b.brokerName}
//       </option>
//     ))}
//   </select>
// </div>

//               {/* Password */}
//               <div>
//                 <Label>Password<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />

//                   <span
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
//                   >
//                     {showPassword ? (
//                       <EyeIcon className="size-5 fill-gray-500" />
//                     ) : (
//                       <EyeCloseIcon className="size-5 fill-gray-500" />
//                     )}
//                   </span>
//                 </div>
//               </div>

//               {/* Checkbox */}
//               <div className="flex items-center gap-3">
//                 <Checkbox
//                   checked={isChecked}
//                   onChange={(val) => {
//                     setIsChecked(val);
//                     localStorage.setItem("termsAccepted", JSON.stringify(val));
//                   }}
//                 />

//                 <p className="text-sm text-gray-500">
//                   By creating an account, you agree to our{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Terms</Link>{" "}
//                   &{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Privacy Policy</Link>
//                 </p>
//               </div>

//               {/* Submit */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full py-3 text-white! rounded-lg ${
//                   loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"
//                 }`}
//               >
//                 {loading ? "Signing Up..." : "Sign Up"}
//               </button>

//             </div>
//           </form>

//           <p className="mt-5 text-sm text-center text-gray-700">
//             Already have an account?{" "}
//             <Link to="/" className="text-brand-500 hover:text-brand-600">
//               Sign In
//             </Link>
//           </p>

//         </div>
//       </div>
//     </div>
//   );
// }



// import { FormEvent, useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// export default function SignUpForm() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [broker, setBroker] = useState("");
//   const [email, setEmail] = useState("");
//   const [mob, setMob] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isChecked, setIsChecked] = useState(() => {
//     return JSON.parse(localStorage.getItem("termsAccepted") || "false");
//   });
//   const [brokers, setBrokers] = useState([]);
//   const [customerId, setCustomerId] = useState("");
//   const [showCustomerId, setShowCustomerId] = useState(false);
//   const [sourceData, setSourceData] = useState(null);



  

//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//    // ===========================
//   // LOAD BROKERS
//   // ===========================
//   useEffect(() => {
//     const fetchBrokers = async () => {
//       try {
//         const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         });
//         if (res.data.status) {
//           setBrokers(res.data.data);
//         }
//       } catch (err) {
//         toast.error("Failed to load brokers");
//       }
//     };
//     fetchBrokers();
//   }, []);


//    // ===========================
//   // FETCH SOURCE BY MOBILE
//   // ===========================
//   const fetchSourceData = async (mobile:any) => {
//     try {

//       console.log('hello call !');
      
//       const res = await axios.get(`http://192.168.1.13:5000/api/auth/getsourcedata?mobile=${mobile}`);
//       if (res.data.success && res.data.data) {

//           console.log(res.data.data,'res.data.data !');
//         setSourceData(res.data.data);
//         setShowCustomerId(false);
//       } else {
//         setShowCustomerId(true);
//         setSourceData(null);
//       }
//     } catch (err) {
//       setShowCustomerId(true);
//       setSourceData(null);
//     }
//   };

//   // ===========================
//   // FETCH SOURCE BY CUSTOMER ID
//   // ===========================
//   const fetchSourceByCustomerId = async (custId: string) => {
//     try {
//       const res = await axios.get(
//         `http://192.168.1.13:5000/api/auth/getsourcedata?id=${custId}`
//       );

//       if (res.data.success && res.data.data) {

//         console.log(res.data.data);
        
//         setSourceData(res.data.data);
//         toast.success("Customer data found");
//       } else {
//         setSourceData(null);
//         toast.error("Customer ID not found");
//       }
//     } catch {
//       toast.error("Invalid Customer ID");
//       setSourceData(null);
//     }
//   };

//    // ===========================
//   // MOBILE CHANGE
//   // ===========================
//   const handleMobChange = (e:any) => {
//     const value = e.target.value;
//     setMob(value);
//     if (value.length === 10) {
//       fetchSourceData(value);
//     }else if(value.length>10){

//        toast.error("Please Enter only 10 Digit in Mobile Number");
//        return;

//     }
//   };

//    // ===========================
//   // CUSTOMER ID CHANGE
//   // ===========================
//   const handleCustomerIdChange = (e: any) => {
//     const value = e.target.value;
//     setCustomerId(value);

//     if (value.length >= 3) {
//       fetchSourceByCustomerId(value);
//     }
//   };

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!isChecked) {
//       toast.error("Please accept the Terms and Conditions before signing up.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const payload:any = {
//         firstName: firstName.trim(),
//         lastName: lastName.trim(),
//         email: email.trim(),
//         mob: mob,
//         password: password,
//         isChecked: isChecked,
//         broker: broker,
//       };
//       if (sourceData) {
//         payload.customerId = sourceData.customer_id;
//         payload.customerName = sourceData.customer_name;
//         payload.assignedTo = sourceData.assigned_to;
//         payload.assignedUserName = sourceData.assigned_user_name;
//         payload.batchId = sourceData.batch_id;
//         payload.batchSourceName = sourceData.batch_source_name;
//       } else if (showCustomerId) {
//         payload.customerId = customerId;
//       }
//       const response = await axios.post(`${apiUrl}/auth/register`, payload);
//       if (response.data.status === true) {
//         toast.success("User registered successfully!");
//         setFirstName("");
//         setLastName("");
//         setEmail("");
//         setMob("");
//         setPassword("");
//         setBroker("");
//         setIsChecked(false);
//         setCustomerId("");
//         localStorage.setItem("token", response?.data?.token);
//         localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));
//         navigate("/dashboard");
//       } else {
//         toast.error(response.data.message);
//       }
//     } catch (error: any) {
//       toast.error(
//         error.response?.data?.message ||
//           "Something went wrong. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-white">
//       <div className="hidden lg:flex w-[45%] p-4">
//         <div
//           className="flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat relative rounded-2xl w-full h-full p-6"
//           style={{
//             backgroundImage: "url('/Login.jpeg')",
//           }}
//         >
//           <img
//             src="/logo1.svg"
//             alt="Logo"
//             className="absolute z-10 w-48 top-125"
//           />
//         </div>
//       </div>
//       <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-[55%] px-6">
//         <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">
//           <div className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Sign Up
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Enter your details to create your account.
//             </p>
//           </div>
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-5">
//               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                 <div>
//                   <Label>First Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter first name"
//                     value={firstName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Last Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter last name"
//                     value={lastName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Email<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div>
//                 <Label>Mobile<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="number"
//                   placeholder="Enter mobile number"
//                   value={mob}
//                   onChange={handleMobChange}
//                   required
//                 />
//               </div>
//               {showCustomerId && (
//                 <div>
//                   <Label>Customer ID<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter customer ID"
//                     value={customerId}
//                      onChange={handleCustomerIdChange}
//                     required
//                   />
//                 </div>
//               )}
//               <div>
//                 <Label>Broker<span className="text-error-500">*</span></Label>
//                 <select
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
//                   value={broker}
//                   onChange={(e) => setBroker(e.target.value)}
//                   required
//                 >
//                   <option value="">Select Broker</option>
//                   {brokers.map((b: any) => (
//                     <option key={b.id} value={b.brokerName}>
//                       {b.brokerName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <Label>Password<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <span
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
//                   >
//                     {showPassword ? (
//                       <EyeIcon className="size-5 fill-gray-500" />
//                     ) : (
//                       <EyeCloseIcon className="size-5 fill-gray-500" />
//                     )}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Checkbox
//                   checked={isChecked}
//                   onChange={(val) => {
//                     setIsChecked(val);
//                     localStorage.setItem("termsAccepted", JSON.stringify(val));
//                   }}
//                 />
//                 <p className="text-sm text-gray-500">
//                   By creating an account, you agree to our{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Terms</Link>{" "}
//                   &{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Privacy Policy</Link>
//                 </p>
//               </div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full py-3 text-white! rounded-lg ${
//                   loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"
//                 }`}
//               >
//                 {loading ? "Signing Up..." : "Sign Up"}
//               </button>
//             </div>
//           </form>
//           <p className="mt-5 text-sm text-center text-gray-700">
//             Already have an account?{" "}
//             <Link to="/" className="text-brand-500 hover:text-brand-600">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }




// ====================fetch mobile no to crm data========================



// import { FormEvent, useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// export default function SignUpForm() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [broker, setBroker] = useState("");
//   const [email, setEmail] = useState("");
//   const [mob, setMob] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isChecked, setIsChecked] = useState(() => {
//     return JSON.parse(localStorage.getItem("termsAccepted") || "false");
//   });
//   const [brokers, setBrokers] = useState([]);
//   const [customerId, setCustomerId] = useState("");
//   const [showCustomerId, setShowCustomerId] = useState(false);
//   const [sourceData, setSourceData] = useState(null);
//   const [mobileVerified, setMobileVerified] = useState(false);
//   const [customerIdVerified, setCustomerIdVerified] = useState(false);

//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//   // ===========================
//   // LOAD BROKERS
//   // ===========================
//   useEffect(() => {
//     const fetchBrokers = async () => {
//       try {
//         const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         });
//         if (res.data.status) {
//           setBrokers(res.data.data);
//         }
//       } catch (err) {
//         toast.error("Failed to load brokers");
//       }
//     };
//     fetchBrokers();
//   }, []);

//   // ===========================
//   // FETCH SOURCE BY MOBILE
//   // ===========================
//   const fetchSourceData = async (mobile: any) => {
//     try {
//       const res = await axios.get(`http://192.168.1.13:5000/api/auth/getsourcedata?mobile=${mobile}`);
//       if (res.data.success && res.data.data) {
//         setSourceData(res.data.data);
//         setMobileVerified(true);
//         setShowCustomerId(false);
//         setCustomerIdVerified(false);
//       } else {
//         setShowCustomerId(true);
//         setSourceData(null);
//         setMobileVerified(false);
//       }
//     } catch (err) {
//       setShowCustomerId(true);
//       setSourceData(null);
//       setMobileVerified(false);
//     }
//   };

//   // ===========================
//   // FETCH SOURCE BY CUSTOMER ID
//   // ===========================
//   const fetchSourceByCustomerId = async (custId: string) => {
//     try {
//       const res = await axios.get(
//         `http://192.168.1.13:5000/api/auth/getsourcedata?id=${custId}`
//       );

//       if (res.data.success && res.data.data) {
//         setSourceData(res.data.data);
//         setCustomerIdVerified(true);
//         setMobileVerified(false);
//         toast.success("Customer data found");
//       } else {
//         setSourceData(null);
//         setCustomerIdVerified(false);
//         toast.error("Customer ID not found");
//       }
//     } catch {
//       toast.error("Invalid Customer ID");
//       setSourceData(null);
//       setCustomerIdVerified(false);
//     }
//   };

//   // ===========================
//   // MOBILE CHANGE
//   // ===========================
//   const handleMobChange = (e: any) => {
//     const value = e.target.value;
//     setMob(value);
//     setMobileVerified(false);
//     setCustomerIdVerified(false);
//     setSourceData(null);
    
//     if (value.length === 10) {
//       fetchSourceData(value);
//     } else if (value.length > 10) {
//       toast.error("Please Enter only 10 Digit in Mobile Number");
//       return;
//     }
//   };

//   // ===========================
//   // CUSTOMER ID CHANGE
//   // ===========================
//   const handleCustomerIdChange = (e: any) => {
//     const value = e.target.value;
//     setCustomerId(value);
//     setCustomerIdVerified(false);
//     setMobileVerified(false);
//     setSourceData(null);

//     if (value.length >= 3) {
//       fetchSourceByCustomerId(value);
//     }
//   };

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!isChecked) {
//       toast.error("Please accept the Terms and Conditions before signing up.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const payload: any = {
//         firstName: firstName.trim(),
//         lastName: lastName.trim(),
//         email: email.trim(),
//         mob: mob,
//         password: password,
//         isChecked: isChecked,
//         broker: broker,
//       };
//       if (sourceData) {
//         payload.customerId = sourceData.customer_id;
//         payload.customerName = sourceData.customer_name;
//         payload.assignedTo = sourceData.assigned_to;
//         payload.assignedUserName = sourceData.assigned_user_name;
//         payload.batchId = sourceData.batch_id;
//         payload.batchSourceName = sourceData.batch_source_name;
//       } else if (showCustomerId) {
//         payload.customerId = customerId;
//       }
//       const response = await axios.post(`${apiUrl}/auth/register`, payload);
//       if (response.data.status === true) {
//         toast.success("User registered successfully!");
//         setFirstName("");
//         setLastName("");
//         setEmail("");
//         setMob("");
//         setPassword("");
//         setBroker("");
//         setIsChecked(false);
//         setCustomerId("");
//         setMobileVerified(false);
//         setCustomerIdVerified(false);
//         localStorage.setItem("token", response?.data?.token);
//         localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));
//         navigate("/dashboard");
//       } else {
//         toast.error(response.data.message);
//       }
//     } catch (error: any) {
//       toast.error(
//         error.response?.data?.message ||
//         "Something went wrong. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-white">
//       <div className="hidden lg:flex w-[45%] p-4">
//         <div
//           className="flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat relative rounded-2xl w-full h-full p-6"
//           style={{
//             backgroundImage: "url('/Login.jpeg')",
//           }}
//         >
//           <img
//             src="/logo1.svg"
//             alt="Logo"
//             className="absolute z-10 w-48 top-125"
//           />
//         </div>
//       </div>
//       <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-[55%] px-6">
//         <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">
//           <div className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Sign Up
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Enter your details to create your account.
//             </p>
//           </div>
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-5">
//               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                 <div>
//                   <Label>First Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter first name"
//                     value={firstName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Last Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter last name"
//                     value={lastName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Email<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div>
//                 <Label>Mobile<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type="number"
//                     placeholder="Enter mobile number"
//                     value={mob}
//                     onChange={handleMobChange}
//                     required
//                   />
//                   {mobileVerified && (
//                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </span>
//                   )}
//                 </div>
//               </div>
//               {showCustomerId && (
//                 <div>
//                   <Label>Customer ID<span className="text-error-500">*</span></Label>
//                   <div className="relative">
//                     <Input
//                       type="text"
//                       placeholder="Enter customer ID"
//                       value={customerId}
//                       onChange={handleCustomerIdChange}
//                       required
//                     />
//                     {customerIdVerified && (
//                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               )}
//               <div>
//                 <Label>Broker<span className="text-error-500">*</span></Label>
//                 <select
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
//                   value={broker}
//                   onChange={(e) => setBroker(e.target.value)}
//                   required
//                 >
//                   <option value="">Select Broker</option>
//                   {brokers.map((b: any) => (
//                     <option key={b.id} value={b.brokerName}>
//                       {b.brokerName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <Label>Password<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <span
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
//                   >
//                     {showPassword ? (
//                       <EyeIcon className="size-5 fill-gray-500" />
//                     ) : (
//                       <EyeCloseIcon className="size-5 fill-gray-500" />
//                     )}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Checkbox
//                   checked={isChecked}
//                   onChange={(val) => {
//                     setIsChecked(val);
//                     localStorage.setItem("termsAccepted", JSON.stringify(val));
//                   }}
//                 />
//                 <p className="text-sm text-gray-500">
//                   By creating an account, you agree to our{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Terms</Link>{" "}
//                   &{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Privacy Policy</Link>
//                 </p>
//               </div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full py-3 text-white! rounded-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"
//                   }`}
//               >
//                 {loading ? "Signing Up..." : "Sign Up"}
//               </button>
//             </div>
//           </form>
//           <p className="mt-5 text-sm text-center text-gray-700">
//             Already have an account?{" "}
//             <Link to="/" className="text-brand-500 hover:text-brand-600">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }




// ================================= drop down ================================



// import { FormEvent, useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// export default function SignUpForm() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [broker, setBroker] = useState("");
//   const [email, setEmail] = useState("");
//   const [mob, setMob] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isChecked, setIsChecked] = useState(() => {
//     return JSON.parse(localStorage.getItem("termsAccepted") || "false");
//   });
//   const [brokers, setBrokers] = useState([]);
//   const [customerId, setCustomerId] = useState("");
//   const [showCustomerId, setShowCustomerId] = useState(false);
//   const [sourceData, setSourceData] = useState(null);
//   const [mobileVerified, setMobileVerified] = useState(false);
//   const [customerIdVerified, setCustomerIdVerified] = useState(false);

//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//   // ===========================
//   // LOAD BROKERS
//   // ===========================
//   useEffect(() => {
//     const fetchBrokers = async () => {
//       try {
//         const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         });
//         if (res.data.status) {
//           setBrokers(res.data.data);
//         }
//       } catch (err) {
//         toast.error("Failed to load brokers");
//       }
//     };
//     fetchBrokers();
//   }, []);

//   // ===========================
//   // FETCH SOURCE BY MOBILE
//   // ===========================
//   const fetchSourceData = async (mobile: any) => {
//     try {
//       const res = await axios.get(`http://192.168.1.13:5000/api/auth/getsourcedata?mobile=${mobile}`);
//       if (res.data.success && res.data.data) {
//         setSourceData(res.data.data);
//         setMobileVerified(true);
//         setShowCustomerId(false);
//         setCustomerIdVerified(false);
//       } else {
//         setShowCustomerId(true);
//         setSourceData(null);
//         setMobileVerified(false);
//       }
//     } catch (err) {
//       setShowCustomerId(true);
//       setSourceData(null);
//       setMobileVerified(false);
//     }
//   };

//   // ===========================
//   // FETCH SOURCE BY CUSTOMER ID
//   // ===========================
//   const fetchSourceByCustomerId = async (custId: string) => {
//     try {
//       const res = await axios.get(
//         `http://192.168.1.13:5000/api/auth/getsourcedata?id=${custId}`
//       );

//       if (res.data.success && res.data.data) {
//         setSourceData(res.data.data);
//         setCustomerIdVerified(true);
//         setMobileVerified(false);
//         toast.success("Customer data found");
//       } else {
//         setSourceData(null);
//         setCustomerIdVerified(false);
//         toast.error("Customer ID not found");
//       }
//     } catch {
//       toast.error("Invalid Customer ID");
//       setSourceData(null);
//       setCustomerIdVerified(false);
//     }
//   };

//   // ===========================
//   // MOBILE CHANGE
//   // ===========================
//   const handleMobChange = (e: any) => {
//     const value = e.target.value;
//     setMob(value);
//     setMobileVerified(false);
//     setCustomerIdVerified(false);
//     setSourceData(null);
    
//     if (value.length === 10) {
//       fetchSourceData(value);
//     } else if (value.length > 10) {
//       toast.error("Please Enter only 10 Digit in Mobile Number");
//       return;
//     }
//   };

//   // ===========================
//   // CUSTOMER ID CHANGE
//   // ===========================
//   const handleCustomerIdChange = (e: any) => {
//     const value = e.target.value;
//     setCustomerId(value);
//     setCustomerIdVerified(false);
//     setMobileVerified(false);
//     setSourceData(null);

//     if (value.length >= 3) {
//       fetchSourceByCustomerId(value);
//     }
//   };

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!isChecked) {
//       toast.error("Please accept the Terms and Conditions before signing up.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const payload: any = {
//         firstName: firstName.trim(),
//         lastName: lastName.trim(),
//         email: email.trim(),
//         mob: mob,
//         password: password,
//         isChecked: isChecked,
//         broker: broker,
//       };
//       if (sourceData) {
//         payload.customerId = sourceData.customer_id;
//         payload.customerName = sourceData.customer_name;
//         payload.assignedTo = sourceData.assigned_to;
//         payload.assignedUserName = sourceData.assigned_user_name;
//         payload.batchId = sourceData.batch_id;
//         payload.batchSourceName = sourceData.batch_source_name;
//       } else if (showCustomerId) {
//         payload.customerId = customerId;
//       }
//       const response = await axios.post(`${apiUrl}/auth/register`, payload);
//       if (response.data.status === true) {
//         toast.success("User registered successfully!");
//         setFirstName("");
//         setLastName("");
//         setEmail("");
//         setMob("");
//         setPassword("");
//         setBroker("");
//         setIsChecked(false);
//         setCustomerId("");
//         setMobileVerified(false);
//         setCustomerIdVerified(false);
//         localStorage.setItem("token", response?.data?.token);
//         localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));
//         navigate("/dashboard");
//       } else {
//         toast.error(response.data.message);
//       }
//     } catch (error: any) {
//       toast.error(
//         error.response?.data?.message ||
//         "Something went wrong. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-white">
//       <div className="hidden lg:flex w-[45%] p-4">
//         <div
//           className="flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat relative rounded-2xl w-full h-full p-6"
//           style={{
//             backgroundImage: "url('/Login.jpeg')",
//           }}
//         >
//           <img
//             src="/logo1.svg"
//             alt="Logo"
//             className="absolute z-10 w-48 top-125"
//           />
//         </div>
//       </div>
//       <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-[55%] px-6">
//         <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">
//           <div className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Sign Up
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Enter your details to create your account.
//             </p>
//           </div>
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-5">
//               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
//                 <div>
//                   <Label>First Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter first name"
//                     value={firstName}
//                     onChange={(e) => setFirstName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label>Last Name<span className="text-error-500">*</span></Label>
//                   <Input
//                     type="text"
//                     placeholder="Enter last name"
//                     value={lastName}
//                     onChange={(e) => setLastName(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Email<span className="text-error-500">*</span></Label>
//                 <Input
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div>
//                 <Label>Mobile<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type="number"
//                     placeholder="Enter mobile number"
//                     value={mob}
//                     onChange={handleMobChange}
//                     required
//                   />
//                   {mobileVerified && (
//                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </span>
//                   )}
//                 </div>
//               </div>
//               {showCustomerId && (
//                 <div>
//                   <Label>Customer ID<span className="text-error-500">*</span></Label>
//                   <div className="relative">
//                     <Input
//                       type="text"
//                       placeholder="Enter customer ID"
//                       value={customerId}
//                       onChange={handleCustomerIdChange}
//                       required
//                     />
//                     {customerIdVerified && (
//                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               )}
//               <div>
//                 <Label>Broker<span className="text-error-500">*</span></Label>
//                 <select
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
//                   value={broker}
//                   onChange={(e) => setBroker(e.target.value)}
//                   required
//                 >
//                   <option value="">Select Broker</option>
//                   {brokers.map((b: any) => (
//                     <option key={b.id} value={b.brokerName}>
//                       {b.brokerName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <Label>Password<span className="text-error-500">*</span></Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <span
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
//                   >
//                     {showPassword ? (
//                       <EyeIcon className="size-5 fill-gray-500" />
//                     ) : (
//                       <EyeCloseIcon className="size-5 fill-gray-500" />
//                     )}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Checkbox
//                   checked={isChecked}
//                   onChange={(val) => {
//                     setIsChecked(val);
//                     localStorage.setItem("termsAccepted", JSON.stringify(val));
//                   }}
//                 />
//                 <p className="text-sm text-gray-500">
//                   By creating an account, you agree to our{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Terms</Link>{" "}
//                   &{" "}
//                   <Link className="text-blue-500 underline" to="/terms">Privacy Policy</Link>
//                 </p>
//               </div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full py-3 text-white! rounded-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"
//                   }`}
//               >
//                 {loading ? "Signing Up..." : "Sign Up"}
//               </button>
//             </div>
//           </form>
//           <p className="mt-5 text-sm text-center text-gray-700">
//             Already have an account?{" "}
//             <Link to="/" className="text-brand-500 hover:text-brand-600">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }












import { FormEvent, useState,useEffect } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import axios from "axios";
import { toast } from "react-toastify";
// import Button from "../ui/button/Button";
import { useNavigate } from "react-router";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [broker, setBroker] = useState("");
  const [email, setEmail] = useState("");
  const [mob, setMob] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

 // // 🔹 Employee dropdown selected value
// const [employee, setEmployee] = useState("");

// // 🔹 Source dropdown selected value
// const [source, setSource] = useState("");

// Dropdown list values  ❗ YE MISSING THA
// const [employees, setEmployees] = useState<string[]>([]);
// const [sources, setSources] = useState<string[]>([]);


  const apiUrl = import.meta.env.VITE_API_URL;
  // const apiCRMURL = import.meta.env.VITE__CRM_API_URL;


  const navigate = useNavigate();

  const [isChecked, setIsChecked] = useState(() => {
    return JSON.parse(localStorage.getItem("termsAccepted") || "false");
  });

  const [brokers, setBrokers] = useState([]);


//   // 🔹 Employee API
// const getEmployeeList = async () => {
//   try {
//     const res = await axios.get(`${apiCRMURL}/employee/get`);

//     // 🔥 Transform API response to static-like format
//     return {
//       status: true,
//       data: res.data.map((emp: any) => emp.name),
//     };
//   } catch (error) {
//     console.error("Employee API error", error);
//     return {
//       status: false,
//       data: [],
//     };
//   }
// };

// // 🔹 Source API
// const getSourceList = async () => {
//   try {
//     const res = await axios.get(`${apiCRMURL}/customers/get-batches`);

//     // 🔥 Convert backend response to static-like format
//     return {
//       status: true,
//       data: res.data.map((item: any) => item.source_name),
//     };
//   } catch (error) {
//     console.error("Source API error", error);
//     return {
//       status: false,
//       data: [],
//     };
//   }
// };



  useEffect(() => {

   
    
  const fetchBrokers = async () => {
    try {

      const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.data.status) {
        setBrokers(res.data.data);
      }
    } catch (err) {

     
      
      toast.error("Failed to load brokers");
    }

    // const employeeRes = await getEmployeeList();
    // const sourceRes = await getSourceList();

    //   if (employeeRes.status) {
    //     setEmployees(employeeRes.data);
    //   }

    //   if (sourceRes.status) {
    //     setSources(sourceRes.data);
    //   }

  };
  fetchBrokers();

  

}, []);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error("Please accept the Terms and Conditions before signing up.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mob: mob,
        password: password,
        isChecked: isChecked,
        broker: broker,
        // employee:employee,
        // source:source
      });

      if (response.data.status === true) {
        toast.success("User registered successfully!");

        setFirstName("");
        setLastName("");
        setEmail("");
        setMob("");
        setPassword("");
        setBroker("");
        setIsChecked(false);

        localStorage.setItem("token", response?.data?.token);
        localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));

        navigate("/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">

{/* LEFT SIDE WITH BG IMAGE + LOGO */}
<div className="hidden lg:flex w-[45%] p-4">
  
  <div
    className="flex flex-col justify-center items-center bg-cover bg-center bg-no-repeat relative rounded-2xl w-full h-full p-6"
    style={{
      backgroundImage: "url('/Login.jpeg')",
    }}
  >
    {/* LOGO */}
        <img
          src="/logo1.svg"
          alt="Logo"
          className="absolute z-10 w-48 top-125"
        />
  </div>
</div>


      {/* RIGHT SIDE SIGNUP FORM */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-[55%] px-6">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10">

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create your account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">

              {/* Names */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  {/* <Label>First Name<span className="text-error-500">*</span></Label> */}
                  <Input
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  {/* <Label>Last Name<span className="text-error-500">*</span></Label> */}
                  <Input
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                {/* <Label>Email<span className="text-error-500">*</span></Label> */}
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                {/* <Label>Mobile<span className="text-error-500">*</span></Label> */}
                <Input
                  type="number"
                  placeholder="Enter mobile number"
                  value={mob}
                  onChange={(e) => setMob(e.target.value)}
                  required
                />
              </div>

             {/* Employee */}
              {/* <div>
                <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp:any) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
              </div> */}

              <div>
                {/* Source */}
                {/* <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                >
                  <option value="">Select Source</option>
                  {sources.map((src:any) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select> */}
              </div>

              <div>
  {/* <Label>Broker<span className="text-error-500">*</span></Label> */}
  <select
    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
    value={broker}
    onChange={(e) => setBroker(e.target.value)}
    required
  >
    <option value="">Select Broker</option>
    {brokers.map((b: any) => (
      <option key={b.id} value={b.brokerName}>
        {b.brokerName}
      </option>
    ))}
  </select>
</div>

              {/* Password */}
              <div>
                {/* <Label>Password<span className="text-error-500">*</span></Label> */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500" />
                    )}
                  </span>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isChecked}
                  onChange={(val) => {
                    setIsChecked(val);
                    localStorage.setItem("termsAccepted", JSON.stringify(val));
                  }}
                />

                <p className="text-sm text-gray-500">
                  By creating an account, you agree to our{" "}
                  <Link className="text-blue-500 underline" to="/terms">Terms</Link>{" "}
                  &{" "}
                  <Link className="text-blue-500 underline" to="/terms">Privacy Policy</Link>
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white! rounded-lg ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"
                }`}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>

            </div>
          </form>

          <p className="mt-5 text-sm text-center text-gray-700">
            Already have an account?{" "}
            <Link to="/" className="text-brand-500 hover:text-brand-600">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}