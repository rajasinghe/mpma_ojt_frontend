import { useEffect } from "react";
import LoginComponent from "../features/Authentication/Components/Login/LoginComponent";
import { useSession } from "../contexts/SessionContext";

export default function LoginPage() {
  const { logout } = useSession();
  
  useEffect(() => {
    //implement the sign up mechanism here
    localStorage.removeItem("token");
    logout(); // Ensure complete logout
  }, [logout]);
  
  return (
    <div>
      <LoginComponent />
    </div>
  );
}
