import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/Loader/Loader";
import UserProfile from "../Components/User/UserProfile/UserProfile";

export default function UserProfilePage() {
  const { state } = useNavigation();
  const user = useLoaderData() as any;

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div className="d-flex main p-4">
          <UserProfile className="mx-auto mt-3" user={user} />
        </div>
      )}
    </>
  );
}
