import { useEffect } from "react";
import LoginComponent from "../features/Authentication/Components/Login/LoginComponent";

export default function LoginPage() {
  useEffect(() => {
    //implement the sign up mechanism here
    localStorage.removeItem("token");
  }, []);
  return (
    <div>
      <LoginComponent />
    </div>
  );
}
