import MultipleAttendanceForm from "./MultipleAttendanceForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function MultipleAttendancePage() {
  return (
    <MainContainer title="Add Multiple Interviews" breadCrumbs={["Home", "Interview", "Multiple Interviews"]}>
      <SubContainer>
        <MultipleAttendanceForm />
      </SubContainer>
    </MainContainer>
  );
}