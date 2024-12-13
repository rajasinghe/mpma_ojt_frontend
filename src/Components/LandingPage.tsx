import { useNavigate, useNavigation } from "react-router-dom";
import Loader from "./Loader/Loader";
import { useEffect } from "react";

export default function LandingPage() {
  const { state } = useNavigation();
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/OJT/Trainees");
  }, []);
  return <>{state == "loading" ? <Loader /> : ""}</>;
}
