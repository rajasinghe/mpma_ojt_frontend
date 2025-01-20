import { Outlet, useOutletContext } from "react-router-dom";
import Header from "../layout/header/Header";
import Sidebar from "../layout/sidebar/Sidebar";

export default function Base() {
  const user = useOutletContext() as any;
  return (
    <div>
      {/* <MainNav /> */}
      <Header user={user} />
      <Sidebar user={user} />
      <Outlet />
    </div>
  );
}
