import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/Loader/Loader";
import UserProfile from "../Components/UserProfile/UserProfile";

export default function UserProfilePage() {
  const { state } = useNavigation();
  const user = useLoaderData() as any;
  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div className="d-flex main " style={{ height: "90vh" }}>
          <UserProfile
            className=" mx-auto my-auto"
            id={user && user.id}
            name={user && user.name}
            email={user && user.username}
            type={user && user.type}
          />
        </div>
      )}
    </>
  );
}
