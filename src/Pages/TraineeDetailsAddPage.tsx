import { useLoaderData } from "react-router-dom";
import TraineeForm from "../Components/traineeForm/TraineeForm";

export default function TraineeDetailsAddPage() {
  const loaderData = useLoaderData() as any;
  return (
    <div>
      <section className="bg-primary-subtle ">
        <div className="px-3 fw-bold fs-3">New Trainees</div>
      </section>
      <section className="px-2 mt-1">
        <TraineeForm
          className=" px-2"
          departmentOptions={loaderData.departments}
          periods={loaderData.periods}
        />
      </section>
    </div>
  );
}
