import { useLoaderData } from "react-router-dom";
import TraineeForm from "../Components/traineeForm/TraineeFormV2";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

interface loaderData {
  periods: any[];
  programs: any[];
  institutes: any[];
}

export default function TraineeDetailsAddPageV2() {
  const loaderData = useLoaderData() as loaderData;

  return (
    <MainContainer title="Trainee Registration" breadCrumbs={["Home", "Trainee", "Registration"]}>
      <SubContainer>
        <TraineeForm
          className="p-2"
          periods={loaderData.periods}
          programs={loaderData.programs}
          institutes={loaderData.institutes}
        />
      </SubContainer>
    </MainContainer>
  );
}
