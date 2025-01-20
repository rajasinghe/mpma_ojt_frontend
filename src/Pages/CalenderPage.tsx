import { useLoaderData } from "react-router-dom";
import MarkHolidays from "../Components/Callenders/Holidays/Markholidays";
import { useEffect } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

export default function CalenderPage() {
  const events = useLoaderData();
  useEffect(() => {
    console.log(events);
  }, []);
  return (
    <MainContainer title="Work Calender" breadCrumbs={["Home", "Calender"]}>
      <SubContainer>
        <MarkHolidays events={events} className=" " />
      </SubContainer>
    </MainContainer>
  );
}
