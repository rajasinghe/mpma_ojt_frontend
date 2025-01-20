import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";

import BankDetailsForm from "../Components/BankDetailsForm";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

interface LoaderData {
  trainee: any;
  departmentsList: any[];
}

export default function TraineeAddBankDetailsPage() {
  const trainee = useLoaderData() as LoaderData;
  const { state } = useNavigation();
  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer
          title="Bank Details"
          breadCrumbs={["Home", "Trainee", "Profile", "Bank Details(New)"]}
        >
          <SubContainer>
            <BankDetailsForm trainee={trainee} />
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
