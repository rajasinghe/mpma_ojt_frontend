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

interface ActiveTraineeSummary {
  department_id: number;
  department_name: string;
  active_count: number;
  new_count: number;
}

interface ActiveTraineeSummaryResponse {
  date: string;
  summary: ActiveTraineeSummary[];
  totals: {
    total_active: number;
    total_new: number;
  };
}

export default function ViewInterviewPage() {
  const [departmentNames, setDepartmentNames] = useState<{
    [key: number]: string;
  }>({});
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [showLoginDetailsTable, setShowLoginDetailsTable] = useState(false);

  // Active Trainee Summary Modal States
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] =
    useState<ActiveTraineeSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );

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

  // Fetch Active Trainee Summary
  const fetchActiveTraineeSummary = async (date: string) => {
    try {
      setSummaryLoading(true);
      const response = await api.get(
        `/api/trainee/activeTraineeSummary/${date}`
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching active trainee summary:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load active trainee summary",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle Summary Modal
  const handleShowSummary = () => {
    setShowSummaryModal(true);
    fetchActiveTraineeSummary(selectedDate);
  };

  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
    setSummaryData(null);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (showSummaryModal) {
      fetchActiveTraineeSummary(newDate);
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
                  title="View Active Trainee Summary"
                >
                  <i className="bi bi-graph-up me-1"></i>
                  Summary
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

      {/* Active Trainee Summary Modal */}
      {showSummaryModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="activeTraineeSummaryModal"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="activeTraineeSummaryModal">
                  <i className="bi bi-graph-up me-2"></i>
                  Active Trainee Summary
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseSummaryModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {/* Date Selector */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label htmlFor="summaryDate" className="form-label fw-bold">
                      Select Date:
                    </label>
                    <input
                      type="date"
                      id="summaryDate"
                      className="form-control"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split("T")[0]} // Disable past dates
                    />
                  </div>
                  <div className="col-md-8 d-flex align-items-end">
                    <div className="text-muted">
                      <small>
                        <i className="bi bi-info-circle me-1"></i>
                        Shows active trainees and new trainees for the selected
                        date
                      </small>
                    </div>
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
                    {/* Summary Cards */}
                    <div className="row mb-4">
                      <div className="col-md-4">
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h4 className="card-title">
                              <i className="bi bi-people-fill me-2"></i>
                              {summaryData.totals.total_active}
                            </h4>
                            <p className="card-text">Active Count</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-success text-white">
                          <div className="card-body text-center">
                            <h4 className="card-title">
                              <i className="bi bi-person-plus-fill me-2"></i>
                              {summaryData.totals.total_new}
                            </h4>
                            <p className="card-text">New Count</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-info text-white">
                          <div className="card-body text-center">
                            <h4 className="card-title">
                              <i className="bi bi-plus-circle-fill me-2"></i>
                              {summaryData.totals.total_active +
                                summaryData.totals.total_new}
                            </h4>
                            <p className="card-text">Total Count</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Department-wise Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-hover table-sm">
                        <thead className="table-dark">
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Department</th>
                            <th scope="col" className="text-center">
                              Active Count
                            </th>
                            <th scope="col" className="text-center">
                              New Count
                            </th>
                            <th scope="col" className="text-center">
                              Total Count
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.summary
                            .filter(
                              (dept) =>
                                dept.active_count > 0 || dept.new_count > 0
                            )
                            .map((dept, index) => (
                              <tr key={dept.department_id}>
                                <th scope="row">{index + 1}</th>
                                <td>
                                  <strong>{dept.department_name}</strong>
                                </td>
                                <td className="text-center">
                                  {dept.active_count}
                                </td>
                                <td className="text-center">
                                  {dept.new_count}
                                </td>
                                <td className="text-center">
                                  <strong>
                                    {dept.active_count + dept.new_count}
                                  </strong>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-secondary">
                          <tr>
                            <th colSpan={2} className="text-end">
                              <strong>Total:</strong>
                            </th>
                            <th className="text-center">
                              <strong>{summaryData.totals.total_active}</strong>
                            </th>
                            <th className="text-center">
                              <strong>{summaryData.totals.total_new}</strong>
                            </th>
                            <th className="text-center">
                              <strong>
                                {summaryData.totals.total_active +
                                  summaryData.totals.total_new}
                              </strong>
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Date Info */}
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-calendar-event me-1"></i>
                        Summary for:{" "}
                        <strong>
                          {moment(summaryData.date).format("MMMM DD, YYYY")}
                        </strong>
                      </small>
                    </div>
                  </>
                )}

                {/* No Data State */}
                {!summaryLoading &&
                  summaryData &&
                  summaryData.summary.filter(
                    (dept) => dept.active_count > 0 || dept.new_count > 0
                  ).length === 0 && (
                    <div className="text-center py-4">
                      <i className="bi bi-inbox display-1 text-muted"></i>
                      <h5 className="mt-3 text-muted">No Data Available</h5>
                      <p className="text-muted">
                        No trainee data found for the selected date.
                      </p>
                    </div>
                  )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseSummaryModal}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
