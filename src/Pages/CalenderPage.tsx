import { useLoaderData } from "react-router-dom";
import MarkHolidays from "../Components/Callenders/Holidays/Markholidays";
import { useEffect } from "react";

export default function CalenderPage() {
  const events = useLoaderData();
  useEffect(() => {
    console.log(events);
  }, []);
  return (
    <div>
      <section className="bg-primary-subtle ">
        <div className="px-3 fw-bold fs-3">Work Calender</div>
      </section>
      <section className=" bg-body-tertiary px-2 mt-1">
        <div className="container-fluid border border-dark rounded-2 my-2">
          {/* <div className=" fs-5 fw-bolder">Trainee Schedule</div> */}
          <MarkHolidays events={events} className=" " />
        </div>
      </section>
    </div>
  );
}
