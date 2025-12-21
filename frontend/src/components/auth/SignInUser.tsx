import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
// import Button from "../ui/button/Button";

export default function SignInUser() {
  const [showPassword, setShowPassword] = useState(false);
  // const [isChecked, setIsChecked] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email: emailOrUsername,
        password,
      });

      if (response.data.status == true) {
        const { token, user, angelTokens } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (angelTokens) {
          localStorage.setItem("angel_token", angelTokens.authToken);
          localStorage.setItem("angel_feed_token", angelTokens.feedToken);
          localStorage.setItem("angel_refresh_token", angelTokens.refreshToken);
        }

        toast.success("Login successful!");

        if (user.role == "admin") navigate("/admin/deshboard");
        else navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Login failed. Please try again.");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white p-3">
      {/* LEFT SIDE IMAGE - 40% */}
      <div
        className="hidden lg:flex flex-col justify-center items-center w-[50%] bg-cover bg-center relative rounded-2xl"
        style={{
          backgroundImage: "url('/Login.jpeg')",
        }}
      >
        <div className="absolute inset-0"></div>

        <img
          src="/logo1.svg"
          alt="Logo"
          className="absolute z-10 w-48 top-125"
        />
      </div>

      {/* RIGHT SIDE FORM - 60% */}
      <div className="flex flex-col justify-center items-center px-6 w-full lg:w-[50%]">
        <div className="w-full max-w-md">
<div className="">
  <h1 className="font-semibold text-3xl m-0">Welcome Back to</h1>
<p className="text-3xl text-[#FB3800]" style={{ marginTop: "-10px" }}>
  Software Setu
</p>

</div>


          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Enter your email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  type="text"
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span> */}
                </div>
                {/* <Link
                  to="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link> */}
              </div>

              <button className="w-full bg-black text-white! py-3 rounded-lg" type="submit" disabled={loading}>
                {loading ? "Logging ..." : "Login "}
              </button>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
