import { Outlet, useLocation, useNavigate, useNavigation } from "react-router-dom";
import Loader from "./ui/Loader/Loader";
import { useEffect, useState } from "react";
import api from "../api";
import Swal from "sweetalert2";
export default function LandingPage() {
  const { state } = useNavigation();
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState();

  useEffect(() => {
    //recieve the token from the localstorage
    const token = localStorage.getItem("token");
    console.log(location);
    //authentication procedure and get the the profile info
    console.log("landing effect");
    console.log(token);
    if (token) {
      console.log(token);
      api.defaults.headers.common.Authorization = token;
      authenticate();
    } else {
      navigate("/login");
    }
  }, []);

  const authenticate = async () => {
    try {
      console.log(state);
      setAuthenticating(true);
      const response = await api.get("auth");
      setAuthenticating(false);
      console.log(state);
      console.log(response.data);
      setUser(response.data);

      if (location.pathname == "/") {
        navigate("/OJT/Trainees");
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Session Expired",
        html: "<p>Re login to Continue</p>",
      });
      navigate("/login");
    }
  };
  return <>{authenticating ? <Loader text="Authenticating..." /> : <Outlet context={user} />}</>;
}
