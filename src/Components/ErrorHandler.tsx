import { AxiosError } from "axios";
import { useEffect } from "react";
import { Link, useRouteError } from "react-router-dom";

export default function ErrorHandler() {
  const error = useRouteError() as AxiosError;

  useEffect(() => {
    console.log(error);
  }, []);
  if (error.status && error.status == 401) {
    return (
      <div className="">
        <div className="d-flex flex-column ">
          <p className="display-1 mx-auto my-5">Authentication Failed</p>
          <Link to={"/login"} className="btn btn-primary mx-auto">
            Login
          </Link>
        </div>
      </div>
    );
  }
  return <div>{error.message}</div>;
}
