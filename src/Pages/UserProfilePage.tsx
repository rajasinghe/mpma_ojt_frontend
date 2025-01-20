import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import UserProfile from "../Components/User/UserProfile/UserProfile";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

export default function UserProfilePage() {
  const { state } = useNavigation();
  const user = useLoaderData() as any;

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <>
          <MainContainer breadCrumbs={["Home", "Profile"]} title="Profile Page">
            <SubContainer>
              <UserProfile className="" user={user} />
            </SubContainer>
          </MainContainer>
        </>
      )}
    </>
  );
}
