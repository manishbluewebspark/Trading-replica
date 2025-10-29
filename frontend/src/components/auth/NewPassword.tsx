import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function NewPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "";
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/auth/new-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    newPassword: password,
                    confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to reset password");
            } else {
                toast.success(data.message || "Password reset successfully");
                navigate("/");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center w-1/2 bg-white px-10">
            <div className="w-full max-w-sm">
                <div className="mb-6">
                    <div className="flex items-center">
                        <img
                            src="/images/logo/logo.png"
                            alt="Logo"
                            style={{
                                width: "135px", height: "111px"
                            }}
                        />
                    </div>
                    <h2 className="text-2xl font-semibold mb-1 w-100">New Password</h2>
                    <p className="text-sm text-gray-600 w-100">
                        Enter your new password and confirm it.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 w-100">
                            Password
                        </label>
                        <div className="relative w-80 lg:w-full">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                className="w-full px-3 py-2 border rounded pr-10 focus:outline-none border-gray-300"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div
                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 w-80 lg:w-full">
                        <label className="text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Enter password again"
                                className="w-full px-3 py-2 border rounded pr-10 focus:outline-none border-gray-300"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <div
                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center"
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
                                Submitting...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
