import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
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

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [isChecked, setIsChecked] = useState(() => {
    return JSON.parse(localStorage.getItem("termsAccepted") || "false");
  });

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
                  <Label>First Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Last Name<span className="text-error-500">*</span></Label>
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
                <Label>Email<span className="text-error-500">*</span></Label>
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
                <Label>Mobile<span className="text-error-500">*</span></Label>
                <Input
                  type="number"
                  placeholder="Enter mobile number"
                  value={mob}
                  onChange={(e) => setMob(e.target.value)}
                  required
                />
              </div>

              {/* Broker */}
              <div>
                <Label>Broker<span className="text-error-500">*</span></Label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
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
                <Label>Password<span className="text-error-500">*</span></Label>
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
