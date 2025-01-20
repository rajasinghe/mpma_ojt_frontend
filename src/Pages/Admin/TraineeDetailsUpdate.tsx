import UpdateTrainees from "../../features/updateTrainee/Admin/UpdateTrainees";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";

export default function TraineeDetailsUpdate() {
  return (
    <div className="">
      <MainContainer breadCrumbs={["Home", "Trainee", "Update"]} title="Update Trainee Details">
        <SubContainer>
          <UpdateTrainees />
        </SubContainer>
      </MainContainer>
    </div>
  );
}
