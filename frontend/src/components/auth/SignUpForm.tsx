import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/button/Button";
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
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [isChecked, setIsChecked] = useState(() => {
    return JSON.parse(localStorage.getItem("termsAccepted") || "false");
  });


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log(firstName,lastName,email,mob,password,isChecked,broker);
    

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
        mob:mob,
        password: password,
        isChecked: isChecked,
        broker:broker
      });

    
      if (response.data.status == true) {

        console.log(response.data);
        
        toast.success("User registered successfully!");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setIsChecked(false);
        

      localStorage.setItem("token", response?.data?.token);
      localStorage.setItem("user", JSON.stringify( response?.data?.saveUser));

     
      navigate("/dashboard");

       
      }else {

        console.log(response);
        
         toast.error(response.data.message);
      }
      

    } catch (error: any) {
      if (error.response && error.response.data?.message) {
        alert(error.response.data.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>
          <div>
            {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <Button
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal "
              >
                <FcGoogle />
                Sign up with Google
              </Button>
              <Button
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal"
              >

                Sign up with X
              </Button>
            </div> */}
            {/* <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div> */}
            {/* Form start */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* First Name */}
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  {/* Last Name */}
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {/* Email */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Mobile<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="mob"
                    name="mobile"
                    placeholder="Enter your mobile"
                    value={mob}
                    onChange={(e) => setMob(e.target.value)}
                    required
                  />
                </div>

                <div>
    <Label>
      Broker<span className="text-error-500">*</span>
    </Label>
    <select
      id="broker"
      name="broker"
      value={broker}
      onChange={(e) => setBroker(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    >
      <option value="">Select Broker</option>
      <option value="Angelone">Angelone</option>
      <option value="5Paisa">5Paisa</option>
      <option value="AliceBlue">AliceBlue</option>
      <option value="Binance">Binance</option>
      <option value="BitBns">BitBns</option>
       <option value="kite">Kite</option>
    </select>
  </div>

                {/* Password */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* Checkbox */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={(val) => {
                      setIsChecked(val);
                      localStorage.setItem("termsAccepted", JSON.stringify(val));
                    }}
                  />

                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-blue-500 dark:text-white/90 underline decoration-blue-500">
                      <Link to="/terms">Terms and Conditions,</Link>
                    </span>{" "}
                    and our{" "}
                    <span className=" dark:text-white underline decoration-blue-500 text-blue-500">
                      <Link to="/terms">Privacy Policy</Link>
                    </span>
                  </p>
                </div>
                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg shadow-theme-xs ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-brand-500 hover:bg-brand-600"
                      }`}
                  >
                    {loading ? "Signing Up..." : "Sign Up"}
                  </Button>
                </div>
              </div>
            </form>
            {/* Form end */}
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
