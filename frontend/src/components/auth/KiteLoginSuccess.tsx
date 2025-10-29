import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function KiteLoginSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("user_id");

    if (token) {
      localStorage.setItem("kite_token", token);
      localStorage.setItem("kite_user_id", userId || "");
      toast.success("Zerodha Login Successful!");
      navigate("/dashboard");
    } else {
      toast.error("Zerodha login failed.");
      navigate("/signin");
    }
  }, []);

  return <p>Logging you in with Zerodha...</p>;
}