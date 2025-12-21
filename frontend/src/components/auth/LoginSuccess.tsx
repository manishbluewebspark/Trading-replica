// src/pages/LoginSuccess.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginSuccess() {
  const navigate = useNavigate();

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const userParam = params.get("user");

  if (token && userParam) {
    const user = JSON.parse(decodeURIComponent(userParam));

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    navigate("/dashboard");
  } else {
    navigate("/login");
  }
}, [navigate]);

  return <p>Redirecting...</p>;
}
