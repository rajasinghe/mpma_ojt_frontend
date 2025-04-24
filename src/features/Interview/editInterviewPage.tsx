import InterviewForm from "./interviewForm";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import {dataSample} from "./sampleData.ts"; // Sample data for testing
import { useParams } from "react-router-dom";

export default function EditInterviewPage() {

    const { NIC } = useParams();

    function parseDuration(durationString: string) {
        const [value, unit] = durationString.split(" ");
        return {
          value: parseInt(value),
          unit: unit.toLowerCase().replace(/s$/, "")
        };
    }

    const interviewData = NIC ? 
    dataSample.find(item => item.NIC === NIC) : null;

    if (!interviewData) {
        return <div>Interview not found</div>;
    }

    const parsedDuration = parseDuration(interviewData.duration);

    return(
        <MainContainer title="Edit Interview" breadCrumbs={["Home", "Interview", "Edit Interview"]}>
            <SubContainer>
                <InterviewForm 
                NIC={NIC}
                selections={interviewData.departmentId.map(id => ({
                    departmentId: id
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