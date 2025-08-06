import { useNavigation, useLoaderData, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import Loader from "../../Components/ui/Loader/Loader";
import api from "../../api";
import Swal from "sweetalert2";
import InterviewTables from "./InterviewTables";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
}

export default function ViewInterviewPage() {
  const [departmentNames, setDepartmentNames] = useState<{
    [key: number]: string;
  }>({});
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [showLoginDetailsTable, setShowLoginDetailsTable] = useState(true);

  const { state } = useNavigation();
  const InterviewDetails = useLoaderData() as any;

  const fetchDepartmentNames = async () => {
    try {
      setLoadingDepartments(true);
      const response = await api.get("api/department/summary");
      const departments: DepartmentSummary[] = response.data;

      const deptMap = departments.reduce(
        (acc: { [key: number]: string }, dept) => {
          // Use dep_id instead of id, and name instead of dname
          acc[dept.dep_id] = dept.name;
          return acc;
        },
        {}
      );

      setDepartmentNames(deptMap);
    } catch (error) {
      console.error("Error fetching department names:", error);
      // Optionally show an error message to the user
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load department information",
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    try {
      fetchDepartmentNames();
    } catch (error) {
      console.error("Error fetching department names:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load department information",
      });
    }
  }, []);

  /* useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      try {
        const interviews  = InterviewDetails;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const filtered = interviews.filter((interview: Interview) => {
          if (!showPastInterviews) {
            const interviewDate = new Date(interview.date);
            interviewDate.setHours(0, 0, 0, 0);
            return interviewDate >= currentDate;
          }
          return true;
        });

        setMatchingInterviews(filtered);
        setResultCount(filtered.length);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showPastInterviews]);

 const handleDownload = () => {
    const headers = ["NIC", "Name", "Starting Date", "Duration", "Departments"];
    const dataRows = matchingInterviews.map(interview => ({
      NIC: interview.NIC,
      Name: interview.name,
      "Starting Date": formatDate(interview.date),
      "Duration": interview.duration,
      "Departments": interview.departments
      .map(dept => `${getDepartmentName(dept.id)} (${formatDate(dept.fromDate)} - ${formatDate(dept.toDate)})`)
      .join(", "),
      "From": interview.departments.map(dept => formatDate(dept.fromDate)).join(", "),
      "To": interview.departments.map(dept => formatDate(dept.toDate)).join(", "),
    }));

    const worksheet = utils.json_to_sheet(dataRows, { header: headers });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Interviews");
    writeFileXLSX(workbook, "Interviews.xlsx");
  };*/

  return (
    <>
      {state === "loading" ? (
        <Loader />
      ) : loadingDepartments ? (
        <MiniLoader />
      ) : (
        <MainContainer title="Interviews" breadCrumbs={["Home", "Interviews"]}>
          <SubContainer>
            <div className="pt-4">
              <div className="mb-3"></div>
              <InterviewTables
                allInterviews={InterviewDetails.allInterviews}
                departmentNames={departmentNames}
                showLoginDetailsTable={showLoginDetailsTable}
                onToggleView={() =>
                  setShowLoginDetailsTable(!showLoginDetailsTable)
                }
              />
            </div>
            <section className="px-2 mt-1">
              <div className="d-flex mt-2">
                <Link
                  to={"/OJT/interview/new"}
                  className="btn btn-primary btn-sm ms-auto"
                >
                  Add New Interview
                </Link>
              </div>
            </section>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
