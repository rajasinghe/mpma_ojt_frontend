import { Outlet } from "react-router-dom";
import MainNav from "../Components/NavBars/MainNav";

export default function Base() {
  return (
    <div>
      <MainNav />
      <Outlet />
    </div>
  );
}
