import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function ViewInterviewPage() {
  return (
    <MainContainer title="Pending Interviews" breadCrumbs={["Interviews"]}>
      <SubContainer>
        <div>pending interview page</div>
      </SubContainer>
    </MainContainer>
  );
}
