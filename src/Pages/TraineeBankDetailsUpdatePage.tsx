import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/Loader/Loader";

import BankDetailsForm from "../Components/BankDetailsForm";

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
        <div className="">
          {/* <button
            type="button"
            onClick={() => {
              console.log(errors);
            }}
          >
            show errors
          </button> */}
          {/* header section */}
          <section className="bg-primary-subtle ">
            <div className="px-3 fw-bold fs-3">Update Bank Details</div>
          </section>
          <BankDetailsForm trainee={trainee} />
        </div>
      )}
    </>
  );
}