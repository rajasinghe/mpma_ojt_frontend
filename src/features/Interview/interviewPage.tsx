import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function NewInterviewPage() {
  return (
    <MainContainer title="Trainee Interview" breadCrumbs={["Interviews", "Interview"]}>
      <SubContainer>
        <div>new interview page</div>
      </SubContainer>
    </MainContainer>
  );
}
