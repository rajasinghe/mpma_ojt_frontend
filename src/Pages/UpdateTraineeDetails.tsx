import { useLoaderData } from "react-router-dom";
import { Trainee } from "../Components/traineeForm/Trainee";
import TraineeForm from "../Components/traineeForm/TraineeForm";
import { useEffect } from "react";

interface UpdatePageLoaderProps {
  departments: any;
  trainee: Trainee;
  periods: any;
}

export default function UpdateTraineeDetails() {
  const loaderData = useLoaderData() as UpdatePageLoaderProps;

  useEffect(() => {
    console.log(loaderData.trainee);
    console.log(loaderData.departments);
  });
  return (
    <div>
      <h1>Update Trainee Details</h1>
      <TraineeForm
        className="px-2"
        trainee={loaderData.trainee}
        periods={loaderData.periods}
        departmentOptions={loaderData.departments}
      />
    </div>
  );
}
