import { useNavigation } from "react-router-dom";
import { useState, useEffect } from "react";
import { utils, writeFileXLSX } from "xlsx";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import { formatDate } from "../../helpers";
import Loader from "../../Components/ui/Loader/Loader";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";
import api from "../../api";

interface Interview {
  NIC: string;
  name: string;
  date: string;
  duration: string;
  departmentId: number[];
  department: string[];
}

export default function ViewInterviewPage() {
  const [matchingInterviews, setMatchingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resultCount, setResultCount] = useState<number>(0);
  const [showPastInterviews, setShowPastInterviews] = useState<boolean>(false);

  const { state } = useNavigation();

  const dataSample = [
    {
      NIC: "200112345678",
      name: "John Doe",
      date: "2025-05-01",
      duration: "3 weeks",
      departmentId: [1, 3],
      department: ["Software Engineering", "AI Research"]
    },
    {
      NIC: "200212345679",
      name: "Jane Smith",
      date: "2025-05-03",
      duration: "1 month",
      departmentId: [2],
      department: ["Data Science"]
    },
    {
      NIC: "199812345678",
      name: "Michael Lee",
      date: "2025-05-05",
      duration: "2 weeks",
      departmentId: [4, 5],
      department: ["Cybersecurity", "Networking"]
    },
    {
      NIC: "200012345689",
      name: "Amara Silva",
      date: "2025-05-07",
      duration: "6 months",
      departmentId: [3],
      department: ["AI Research"]
    },
    {
      NIC: "199912345610",
      name: "Ravi Perera",
      date: "2025-05-10",
      duration: "1 year",
      departmentId: [1, 2, 4],
      department: ["Software Engineering", "Data Science", "Cybersecurity"]
    }
  ];
  

  const ViewInterviewPageLoader = async () => {
    try {
      const response = await api.get("");
      return response;
    } catch (error) {
      console.error("Loader Error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        //const { data: interviews } = await ViewInterviewPageLoader();
        const interviews = dataSample;
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
      "Departments": interview.department.join(", ")
    }));

    const worksheet = utils.json_to_sheet(dataRows, { header: headers });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Interviews");
    writeFileXLSX(workbook, "Interviews.xlsx");
  };

  return (
    <>
      {state === "loading" || loading ? (
        <Loader />
      ) : (
        <MainContainer title="Interviews" breadCrumbs={["Home", "Interviews"]}>
          <SubContainer>
            <div className="body">
              <section className="px-2 mt-1">
                <div className="d-flex flex-column">
                  <div className="bg-body-secondary p-2 mb-2 rounded-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="form-check ms-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showPastInterviews"
                          checked={showPastInterviews}
                          onChange={(e) => setShowPastInterviews(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="showPastInterviews">
                          Show All Interviews (Including Past)
                        </label>
                      </div>
                      <div className="ms-auto fw-semibold" style={{ fontSize: "12px" }}>
                        <div>Total Count: {resultCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-2 rounded-2 p-1">
                    <div className="table-responsive rounded-2 table-scrollbar">
                      {loading ? (
                        <MiniLoader />
                      ) : (
                        <table className="table table-sm table-bordered w-100">
                          <thead className="table-dark position-sticky top-0">
                            <tr className="small">
                              <th>NIC</th>
                              <th>Name</th>
                              <th>Starting Date</th>
                              <th>Duration</th>
                              <th>Departments</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchingInterviews.map((interview) => (
                              <tr key={`${interview.NIC}-${interview.date}`}>
                                <td>{interview.NIC}</td>
                                <td>{interview.name}</td>
                                <td>{formatDate(interview.date)}</td>
                                <td>{interview.duration}</td>
                                <td>{interview.department.join(", ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="d-flex mt-2">
                    <button
                      className="btn btn-success btn-sm ms-auto"
                      onClick={handleDownload}
                    >
                      Download Records
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}