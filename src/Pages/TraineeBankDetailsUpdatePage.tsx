import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";

import BankDetailsForm from "../Components/BankDetailsForm";
import { MainContainer } from "../layout/containers/main_container/MainContainer";

interface LoaderData {
  trainee: any;
  departmentsList: any[];
}

export default function TraineeBankDetailsUpdatePage() {
  const trainee = useLoaderData() as LoaderData;
  console.log(trainee);
  const { state } = useNavigation();
  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer
          title="Bank Details"
          breadCrumbs={["Home", "Trainee", "Profile", "Bank Details"]}
        >
          <BankDetailsForm trainee={trainee} />
        </MainContainer>
      )}
    </>
  );
}
