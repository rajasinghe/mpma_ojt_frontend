import InterviewForm from "./interviewForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function NewInterviewPage() {

  return (
    <MainContainer title="Add New Interview" breadCrumbs={["Home", "Interview", "New Interview"]}>
      <SubContainer>
        <InterviewForm selections={[{ departmentId: -1, fromDate: "", toDate: "" }]}
        nicDisable={false} nicValidated={false}/>
      </SubContainer>
    </MainContainer>
  );
}
