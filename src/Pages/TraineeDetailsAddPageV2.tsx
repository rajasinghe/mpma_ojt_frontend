import { useLoaderData } from "react-router-dom";
import TraineeForm from "../Components/traineeForm/TraineeFormV2";

interface loaderData {
  periods: any[];
  programs: any[];
  institutes: any[];
}

export default function TraineeDetailsAddPageV2() {
  const loaderData = useLoaderData() as loaderData;

  return (
    <div className="">
      <section className="bg-primary-subtle ">
        <div className="px-3 fw-bold fs-3">New Trainees</div>
      </section>
      <section className="mx-2 px-1 mt-1 border border-dark-subtle border-2 rounded bg-body-tertiary ">
        <TraineeForm
          className="p-2"
          periods={loaderData.periods}
          programs={loaderData.programs}
          institutes={loaderData.institutes}
        />
      </section>
    </div>
  );
}
