import { ReactNode } from "react";
import "./style.css";
interface MainContainer {
  breadCrumbs: string[];
  children: ReactNode;
  title: string;
}
export const MainContainer = ({ children, breadCrumbs, title }: MainContainer) => {
  return (
    <main
      id="main"
      className="mt-5 p-0 px-3 pt-2 d-flex flex-column"
      style={{
        height: "90vh",
      }}
    >
      <div
        className="pagetitle "
        style={{
          height: "8vh",
        }}
      >
        <h1>{title}</h1>
        <nav className="ms-1">
          <ol className="breadcrumb">
            {breadCrumbs.map((breadCrumb) => (
              <li className="breadcrumb-item active">{breadCrumb}</li>
            ))}
          </ol>
        </nav>
      </div>
      {/* End Page Title */}
      <div className="mt-1">{children}</div>
    </main>
    /* End #main */
  );
};
