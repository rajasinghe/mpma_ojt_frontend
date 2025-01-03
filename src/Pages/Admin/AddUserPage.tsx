import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import UserForm from "../../Components/User/UserForm/UserForm";

export default function AddUsersPage() {
  const loaderData = useLoaderData() as any;
  useEffect(() => {
    console.log(loaderData);
  }, []);
  return (
    <div className="">
      <section className="bg-primary-subtle ">
        <div className="px-3 fw-bold fs-3">Create User Account</div>
      </section>
      <section className="m-1 mx-2 border border-dark-subtle border-2 rounded bg-body-tertiary p-2">
        <UserForm defaultLevels={loaderData} />
      </section>
    </div>
  );
}
