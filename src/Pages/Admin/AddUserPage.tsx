import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import UserForm from "../../Components/User/UserForm/UserForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function AddUsersPage() {
  const loaderData = useLoaderData() as any;
  useEffect(() => {
    console.log(loaderData);
  }, []);
  return (
    <MainContainer title="Create User" breadCrumbs={["Home", "Users", "Create User"]}>
      <SubContainer>
        <UserForm defaultLevels={loaderData} />
      </SubContainer>
    </MainContainer>
  );
}
