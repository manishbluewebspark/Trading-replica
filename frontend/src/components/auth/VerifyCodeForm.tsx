import { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyCodeForm() {
  const [code, setCode] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  // ✅ Email ko location.state se receive kar rahe hain
  const location = useLocation();
  const email = location.state?.email || "";

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updatedCode = [...code];
    updatedCode[index] = value;
    setCode(updatedCode);

    if (value && index < code.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const enteredCode = code.join("");

    if (enteredCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Invalid or expired code");
      } else {
        toast.success(data.message || "Code verified successfully");
        navigate("/new-password", { state: { email } });
      }
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to resend code");
      } else {
        toast.success(data.message || "Code resent successfully");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("Something went wrong while resending code");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-1/2 bg-white p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <img src="/images/logo/logo.png" alt="Logo" style={{ width: 135, height: 111 }} />
          <h2 className="text-2xl font-semibold mb-1">Verification Code</h2>
          <p className="text-sm text-gray-600">Enter the verification code sent to your email</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-between gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                ref={(el) => {
                  if (el) inputsRef.current[idx] = el;
                }}
                className="w-10 h-12 text-center border rounded text-xl focus:outline-none border-gray-300"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 
                      0 5.373 0 12h4zm2 5.291A7.962 7.962 
                      0 014 12H0c0 3.042 1.135 5.824 
                      3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>

          <div
            className="text-sm text-blue-600 hover:underline cursor-pointer"
            onClick={handleResendCode}
          >
            Resend Code
          </div>
        </form>
      </div>
    </div>
  );
}
