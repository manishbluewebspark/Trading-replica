import { useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleGetCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
      } else {
        toast.success(data.message || "Verification code sent!");
        // ✅ Email ko state ke through pass kar rahe hain
        navigate("/verify-code", { state: { email } });
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white p-6 sm:p-10">
      <div className="w-full max-w-sm mt-60 lg:mt-0">
        <div className="mb-6">
          <div className="flex items-center justify-center md:justify-start">
            <img src="/images/logo/logo.png" alt="Logo" style={{ width: "135px", height: "111px" }} />
          </div>
          <h2 className="text-2xl font-semibold mb-1 text-center md:text-left">Forgot Password</h2>
          <p className="text-sm text-gray-600 text-center md:text-left">
            Enter your email to receive a verification code.
          </p>
        </div>

        <form onSubmit={handleGetCode} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded outline-none border-gray-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center"
            disabled={loading}
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 
                      0 0 5.373 0 12h4zm2 5.291A7.962 
                      7.962 0 014 12H0c0 3.042 1.135 
                      5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Getting code...
              </>
            ) : (
              "Get Code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
