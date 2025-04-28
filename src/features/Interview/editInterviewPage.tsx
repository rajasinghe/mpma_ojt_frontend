import InterviewForm from "./interviewForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import { useLoaderData, useParams } from "react-router-dom";

interface Department {
  id: number;
  fromDate: string;
  toDate: string;
}

interface InterviewDetail {
  id: number;
  NIC: string;
  name: string;
  date: string;
  duration: string;
  departments: Department[];
}

export default function EditInterviewPage() {
  const { NIC } = useParams();
  const interviewDetails = useLoaderData() as InterviewDetail[];

  function parseDuration(durationString: string) {
    const [value, unit] = durationString.split(" ");
    return {
      value: parseInt(value),
      unit: unit.toLowerCase().replace(/s$/, "")
    };
  }

  const interviewData = NIC
    ? interviewDetails.find(item => item.NIC === NIC)
    : null;

  if (!interviewData) {
    return <div>Interview not found</div>;
  }

  const parsedDuration = parseDuration(interviewData.duration);

  return (
    <MainContainer title="Edit Interview" breadCrumbs={["Home", "Interview", "Edit Interview"]}>
      <SubContainer>
        <InterviewForm 
          id={interviewData.id}
          NIC={interviewData.NIC}
          selections={interviewData.departments.map(dept => ({
            departmentId: dept.id,
            fromDate: dept.fromDate,
            toDate: dept.toDate,
          }))} 
          duration={{
            value: parsedDuration.value,
            unit: parsedDuration.unit
          }} 
          startDate={interviewData.date} 
          name={interviewData.name}
          nicValidated={true}
          nicDisable={true}
          isEditing={true}
        />
      </SubContainer>
    </MainContainer>
  );
}
