
// import { useState, FormEvent, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";

// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";

// export default function SignInUser() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [emailOrUsername, setEmailOrUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const apiUrl = import.meta.env.VITE_API_URL;

//   /* =====================================================
//      🔐 AUTO REDIRECT IF ALREADY LOGGED IN
//   ===================================================== */
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     const userStr = localStorage.getItem("user");

//     if (token && userStr) {
//       try {
//         const user = JSON.parse(userStr);

//         if (user?.role === "admin") {
//           navigate("/admin/deshboard", { replace: true });
//         } else {
//           navigate("/dashboard", { replace: true });
//         }
//       } catch (err) {
//         console.error("Invalid user in localStorage");
//         localStorage.clear();
//       }
//     }
//   }, [navigate]);

//   /* =====================================================
//      🔐 LOGIN SUBMIT
//   ===================================================== */
//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const response = await axios.post(`${apiUrl}/auth/login`, {
//         email: emailOrUsername,
//         password,
//       });

//       if (response.data.status === true) {
//         const { token, user, angelTokens } = response.data;

//         localStorage.setItem("token", token);
//         localStorage.setItem("user", JSON.stringify(user));

//         if (angelTokens) {
//           localStorage.setItem("angel_token", angelTokens.authToken || "");
//           localStorage.setItem("angel_feed_token", angelTokens.feedToken || "");
//           localStorage.setItem(
//             "angel_refresh_token",
//             angelTokens.refreshToken || ""
//           );
//         }

//         toast.success("Login successful!");

//         if (user.role === "admin") {
//           navigate("/admin/deshboard", { replace: true });
//         } else {
//           navigate("/dashboard", { replace: true });
//         }
//       } else {
//         toast.error(response.data.message || "Login failed");
//       }
//     } catch (error: any) {
//       toast.error(
//         error?.response?.data?.message || "Login failed. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =====================================================
//      🔐 LOGIN UI
//   ===================================================== */
//   return (
//     <div className="flex min-h-screen bg-white p-3">
//       {/* LEFT IMAGE */}
//       <div
//         className="hidden lg:flex flex-col justify-center items-center w-[50%] bg-cover bg-center rounded-2xl"
//         style={{ backgroundImage: "url('/Login.jpeg')" }}
//       >
//         <img src="/logo1.svg" alt="Logo" className="w-48" />
//       </div>

//       {/* RIGHT FORM */}
//       <div className="flex flex-col justify-center items-center px-6 w-full lg:w-[50%]">
//         <div className="w-full max-w-md">
//           <h1 className="font-semibold text-3xl">Welcome Back to</h1>
//           <p className="text-3xl text-[#FB3800] -mt-2">Software Setu</p>

//           <form onSubmit={handleSubmit} className="mt-6">
//             <div className="space-y-6">
//               <div>
//                 <Label>Email *</Label>
//                 <Input
//                   placeholder="Enter your email or username"
//                   value={emailOrUsername}
//                   onChange={(e) => setEmailOrUsername(e.target.value)}
//                   required
//                 />
//               </div>

//               <div>
//                 <Label>Password *</Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <span
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
//                   >
//                     {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
//                   </span>
//                 </div>
//               </div>

//               <button
//                 className="w-full bg-black text-white py-3 rounded-lg"
//                 type="submit"
//                 disabled={loading}
//               >
//                 {loading ? "Logging..." : "Login"}
//               </button>
//             </div>
//           </form>

//           <p className="text-sm text-center mt-5">
//             Don&apos;t have an account?{" "}
//             <Link to="/signup" className="text-brand-500">
//               Sign Up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }



// import { useState, FormEvent, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";

// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";

// export default function SignInUser() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [emailOrUsername, setEmailOrUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const apiUrl = import.meta.env.VITE_API_URL;

//   /* =====================================================
//      🔐 AUTO REDIRECT IF ALREADY LOGGED IN
//   ===================================================== */
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     const userStr = localStorage.getItem("user");

//     if (token && userStr) {
//       try {
//         const user = JSON.parse(userStr);

//         if (user?.role === "admin") {
//           navigate("/admin/deshboard", { replace: true });
//         } else {
//           navigate("/dashboard", { replace: true });
//         }
//       } catch (err) {
//         localStorage.clear();
//       }
//     }
//   }, [navigate]);

//   /* =====================================================
//      🔐 LOGIN SUBMIT
//   ===================================================== */
//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const response = await axios.post(`${apiUrl}/auth/login`, {
//         email: emailOrUsername,
//         password,
//       });

//       if (response.data.status === true) {
//         const { token, user, angelTokens } = response.data;

//         localStorage.setItem("token", token);
//         localStorage.setItem("user", JSON.stringify(user));

//         if (angelTokens) {
//           localStorage.setItem("angel_token", angelTokens.authToken || "");
//           localStorage.setItem("angel_feed_token", angelTokens.feedToken || "");
//           localStorage.setItem(
//             "angel_refresh_token",
//             angelTokens.refreshToken || ""
//           );
//         }

//         toast.success("Login successful!");

//         if (user.role === "admin") {
//           navigate("/admin/deshboard", { replace: true });
//         } else {
//           navigate("/dashboard", { replace: true });
//         }
//       } else {
//         toast.error(response.data.message || "Login failed");
//       }
//     } catch (error: any) {
//       toast.error(
//         error?.response?.data?.message || "Login failed. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =====================================================
//      🔐 LOGIN UI
//   ===================================================== */
//   return (
//     <div className="flex min-h-screen bg-white p-3">
//       {/* LEFT IMAGE */}
//       <div
//         className="hidden lg:flex flex-col justify-center items-center w-[50%] bg-cover bg-center rounded-2xl"
//         style={{ backgroundImage: "url('/Login.jpeg')" }}
//       >
//         <img src="/logo1.svg" alt="Logo" className="w-48" />
//       </div>

//       {/* RIGHT FORM */}
//       <div className="flex flex-col justify-center items-center px-6 w-full lg:w-[50%]">
//         <div className="w-full max-w-md">
//           <h1 className="font-semibold text-3xl">Welcome Back to</h1>
//           <p className="text-3xl text-[#FB3800] -mt-2">Software Setu</p>

//           <form onSubmit={handleSubmit} className="mt-6">
//             <div className="space-y-6">
//               {/* EMAIL */}
//               <div>
//                 <Label>Email *</Label>
//                 <Input
//                   placeholder="Enter your email or username"
//                   value={emailOrUsername}
//                   onChange={(e) => setEmailOrUsername(e.target.value)}
//                   required
//                 />
//               </div>

//               {/* PASSWORD */}
//               <div>
//                 <Label>Password *</Label>
//                 <div className="relative">
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="pr-12"
//                   />

//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
//                   >
//                     {showPassword ? (
//                       <EyeIcon className="w-5 h-5" />
//                     ) : (
//                       <EyeCloseIcon className="w-5 h-5" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* LOGIN BUTTON */}
//               <button
//                 className="w-full bg-[#FB3800] hover:bg-[#e03200]
//                            text-white py-3 rounded-lg font-semibold transition
//                            disabled:opacity-60"
//                 type="submit"
//                 disabled={loading}
//               >
//                 {loading ? "Logging..." : "Login"}
//               </button>
//             </div>
//           </form>

//           <p className="text-sm text-center mt-5">
//             Don&apos;t have an account?{" "}
//             <Link to="/signup" className="text-[#FB3800] font-medium">
//               Sign Up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }




import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Label from "../form/Label";

export default function SignInUser() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        navigate(
          user?.role === "admin" ? "/admin/deshboard" : "/dashboard",
          { replace: true }
        );
      } catch {
        localStorage.clear();
      }
    }
  }, [navigate]);

  /* ================= LOGIN SUBMIT ================= */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/auth/login`, {
        email: emailOrUsername,
        password,
      });

      if (res.data.status) {
        const { token, user, angelTokens } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (angelTokens) {
          localStorage.setItem("angel_token", angelTokens.authToken || "");
          localStorage.setItem("angel_feed_token", angelTokens.feedToken || "");
          localStorage.setItem("angel_refresh_token", angelTokens.refreshToken || "");
        }

        toast.success("Login successful!");

        navigate(
          user.role === "admin" ? "/admin/deshboard" : "/dashboard",
          { replace: true }
        );
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-white p-3">
      {/* LEFT IMAGE */}
      <div
        className="hidden lg:flex w-[50%] items-center justify-center
                   bg-cover bg-center rounded-2xl"
        style={{ backgroundImage: "url('/Login.jpeg')" }}
      >
        <img src="/logo1.svg" alt="Logo" className="w-48" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex w-full lg:w-[50%] items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold">Welcome Back to</h1>
          <p className="text-3xl text-[#FB3800] -mt-2">Software Setu</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* EMAIL */}
            <div>
              <Label>Email *</Label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email or username"
                required
                className="w-full rounded-lg border border-gray-300
                           px-4 py-3 focus:border-[#FB3800]
                           focus:ring-2 focus:ring-[#FB3800]/30
                           outline-none"
              />
            </div>

            {/* PASSWORD WITH SHOW / HIDE */}
            <div>
              <Label>Password *</Label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-300
                             px-4 py-3 pr-12
                             focus:border-[#FB3800]
                             focus:ring-2 focus:ring-[#FB3800]/30
                             outline-none"
                />

                {/* 👁 SHOW / HIDE ICON */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    /* OPEN EYE */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5
                               c4.478 0 8.268 2.943 9.542 7
                               -1.274 4.057-5.064 7-9.542 7
                               -4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    /* CLOSED EYE */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19
                               c-4.478 0-8.268-2.943-9.542-7
                               a9.956 9.956 0 012.042-3.368" />
                      <path d="M6.223 6.223A9.956 9.956 0 0112 5
                               c4.478 0 8.268 2.943 9.542 7
                               a9.978 9.978 0 01-4.043 5.135" />
                      <path d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#FB3800]
                         py-3 font-semibold text-white
                         transition hover:bg-[#e03200]
                         disabled:opacity-60"
            >
              {loading ? "Logging..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-[#FB3800]">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
