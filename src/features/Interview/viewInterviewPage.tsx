import { useNavigation, useLoaderData, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import Loader from "../../Components/ui/Loader/Loader";
import api from "../../api";
import Swal from "sweetalert2";
import InterviewTables from "./InterviewTables";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";
import moment from "moment";

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
}

interface DepartmentData {
  department_id: number;
  department_name: string;
  new_count: number;
}

interface MondaySummary {
  date: string;
  departments: DepartmentData[];
  total: number;
}

interface InterviewSummaryResponse {
  setNumber: number;
  mondayDates: string[];
  mondaySummaries: MondaySummary[];
  grandTotal: number;
}

export default function ViewInterviewPage() {
  const [departmentNames, setDepartmentNames] = useState<{
    [key: number]: string;
  }>({});
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [showLoginDetailsTable, setShowLoginDetailsTable] = useState(false);

  // Interview Summary Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] =
    useState<InterviewSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);

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

  // Fetch Interview Summary
  const fetchInterviewSummary = async (setNumber: number) => {
    try {
      setSummaryLoading(true);
      const response = await api.get(
        `/api/interview/activeInterviewSummary/${setNumber}`
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching interview summary:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load interview summary",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle Summary Modal
  const handleShowSummary = () => {
    setShowSummaryModal(true);
    setCurrentSetNumber(1);
    fetchInterviewSummary(1);
  };

  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
    setSummaryData(null);
    setCurrentSetNumber(1);
  };

  const handleNextSet = () => {
    const nextSet = currentSetNumber + 1;
    setCurrentSetNumber(nextSet);
    fetchInterviewSummary(nextSet);
  };

  const handlePreviousSet = () => {
    if (currentSetNumber > 1) {
      const prevSet = currentSetNumber - 1;
      setCurrentSetNumber(prevSet);
      fetchInterviewSummary(prevSet);
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
              <div className="mb-3 d-flex justify-content-between align-items-center px-4">
                <Link
                  to={"/OJT/interview/new"}
                  className="btn btn-primary btn-sm"
                >
                  Add New Interview
                </Link>
                <button
                  className="btn btn-info btn-sm"
                  onClick={handleShowSummary}
                  title="View Interview Summary for Next 4 Mondays"
                >
                  <i className="bi bi-calendar-week me-1"></i>
                  Interview Summary
                </button>
              </div>
              <InterviewTables
                allInterviews={InterviewDetails.allInterviews}
                departmentNames={departmentNames}
                showLoginDetailsTable={showLoginDetailsTable}
                onToggleView={() =>
                  setShowLoginDetailsTable(!showLoginDetailsTable)
                }
              />
            </div>
          </SubContainer>
        </MainContainer>
      )}

      {/* Interview Summary Modal */}
      {showSummaryModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="interviewSummaryModal"
          aria-hidden="true"
          onClick={handleCloseSummaryModal}
        >
          <div
            className="modal-dialog modal-lg"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="interviewSummaryModal">
                  <i className="bi bi-calendar-week me-2"></i>
                  Interview Summary (Set {currentSetNumber})
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseSummaryModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {/* Navigation Controls */}
                <div className="row mb-4">
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-outline-success"
                      onClick={handlePreviousSet}
                      disabled={currentSetNumber === 1}
                    >
                      <i className="bi bi-chevron-left me-1"></i>
                      Previous 4 Mondays
                    </button>
                    <div className="text-center">
                      <span className="badge bg-primary fs-6 px-3 py-2">
                        Set {currentSetNumber}
                      </span>
                    </div>
                    <button
                      className="btn btn-outline-success"
                      onClick={handleNextSet}
                    >
                      Next 4 Mondays
                      <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
                {/* Loading State */}
                {summaryLoading && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading summary data...</p>
                  </div>
                )}
                {/* Summary Data */}
                {!summaryLoading && summaryData && (
                  <>
                    {/* Grand Total Card */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h4 className="card-title">
                              <i className="bi bi-calendar-week me-2"></i>
                              {summaryData.grandTotal}
                            </h4>
                            <p className="card-text">
                              Total Interviews (4 Mondays)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4 Mondays Interview Table */}
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm">
                        <thead>
                          <tr className="table-dark">
                            <th scope="col" className="text-start">
                              Department
                            </th>
                            {summaryData.mondaySummaries.map(
                              (monday, index) => (
                                <th
                                  key={index}
                                  scope="col"
                                  className="text-center"
                                >
                                  {moment(monday.date).format("D-MMM")}
                                </th>
                              )
                            )}
                            <th scope="col" className="text-center">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Get all unique departments */}
                          {(() => {
                            const allDepartments =
                              summaryData.mondaySummaries[0]?.departments || [];
                            return allDepartments
                              .map((dept) => {
                                const rowTotal =
                                  summaryData.mondaySummaries.reduce(
                                    (sum, monday) => {
                                      const deptData = monday.departments.find(
                                        (d) =>
                                          d.department_id === dept.department_id
                                      );
                                      return sum + (deptData?.new_count || 0);
                                    },
                                    0
                                  );

                                // Only show departments that have interviews
                                if (rowTotal === 0) return null;

                                return (
                                  <tr key={dept.department_id}>
                                    <td className="fw-bold">
                                      {dept.department_name}
                                    </td>
                                    {summaryData.mondaySummaries.map(
                                      (monday, index) => {
                                        const deptData =
                                          monday.departments.find(
                                            (d) =>
                                              d.department_id ===
                                              dept.department_id
                                          );
                                        const count = deptData?.new_count || 0;
                                        return (
                                          <td
                                            key={index}
                                            className="text-center"
                                            style={{
                                              fontWeight:
                                                count > 0 ? "bold" : "normal",
                                            }}
                                          >
                                            {count > 0 ? count : ""}
                                          </td>
                                        );
                                      }
                                    )}
                                    <td className="text-center fw-bold">
                                      {rowTotal}
                                    </td>
                                  </tr>
                                );
                              })
                              .filter(Boolean);
                          })()}
                        </tbody>
                        <tfoot className="table-secondary">
                          <tr>
                            <th className="text-end">
                              <strong>Total</strong>
                            </th>
                            {summaryData.mondaySummaries.map(
                              (monday, index) => (
                                <th
                                  key={index}
                                  className="text-center"
                                  style={{
                                    color: "#000",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {monday.total}
                                </th>
                              )
                            )}
                            <th className="text-center">
                              <strong>{summaryData.grandTotal}</strong>
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Date Range Info */}
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-calendar-range me-1"></i>
                        Showing interviews for:{" "}
                        <strong>
                          {moment(summaryData.mondayDates[0]).format("MMM DD")}{" "}
                          -{" "}
                          {moment(summaryData.mondayDates[3]).format(
                            "MMM DD, YYYY"
                          )}
                        </strong>
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="btn btn-outline-success"
                  onClick={handlePreviousSet}
                  disabled={currentSetNumber === 1}
                >
                  <i className="bi bi-chevron-left me-1"></i>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseSummaryModal}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Close
                </button>
                <button
                  className="btn btn-outline-success"
                  onClick={handleNextSet}
                >
                  Next
                  <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
