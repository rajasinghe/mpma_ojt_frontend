import InterviewForm from "./interviewForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function NewInterviewPage() {

  return (
    <MainContainer title="Add New Interview" breadCrumbs={["Home", "Interview", "New Interview"]}>
      <SubContainer>
        <InterviewForm NIC={undefined} selections={undefined} duration={undefined} startDate={undefined} name={undefined}
        nicDisable={false} nicValidated={false}/>
      </SubContainer>
    </MainContainer>
  );
}
