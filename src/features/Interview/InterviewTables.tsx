import { useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import editIcon from "../../assets/edit.png";
import removeIcon from "../../assets/remove.png";
import Swal from "sweetalert2";
import api from "../../api";
import "./interview.css";

interface Interview {
  id: number;
  NIC: string;
  name: string;
  date: string;
  email: string;
  duration: string;
  createdAt: string;
  departments: {
    id: number;
    fromDate: string;
    toDate: string;
  }[];
}

interface Props {
  lastSevenDays: Interview[];
  allInterviews: Interview[];
  departmentNames: { [key: number]: string };
}

export default function InterviewTables({
  lastSevenDays,
  allInterviews,
  departmentNames,
}: Props) {
  const [showallInterviews, setShowallInterviews] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [lastSevenDaysFilter, setLastSevenDaysFilter] = useState("");
  const [allInterviewsFilter, setAllInterviewsFilter] = useState("");
  const navigate = useNavigate();

  const handleShowDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInterview(null);
  };

  const filterInterviews = (interviews: Interview[], filterText: string) => {
    if (!filterText.trim()) {
      return interviews;
    }

    const searchTerm = filterText.toLowerCase().trim();
    return interviews.filter(
      (interview) =>
        interview.NIC.toLowerCase().includes(searchTerm) ||
        interview.name.toLowerCase().includes(searchTerm) ||
        interview.email.toLowerCase().includes(searchTerm)
    );
  };

  const handleDelete = async (nic: string) => {
    try {
      const response = await Swal.fire({
        title: "Are You Sure",
        text: "Delete the interview record",
        html: "<div>This action is not reversible</div>",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove from the list",
      });
      if (response.isConfirmed) {
        Swal.fire({
          title: "Please Wait...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await api.delete(`api/interview/${nic}`);
        Swal.fire({
          title: "Deleted!",
          text: "Removed from the List",
          icon: "success",
          showCloseButton: true,
        });
        navigate(0);
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  const renderTable = (interviews: Interview[], _title: string) => (
    <div className="table-responsive">
      <table className="table table-striped table-sm table-bordered table-hover">
        <thead className="table-dark">
          <tr className="small">
            <th>NIC</th>
            <th>Name</th>
            <th>Email</th>
            <th>Start Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((interview) => {
            // Compare only the date part (ignore time)
            const startDate = new Date(interview.date);
            const today = new Date();
            startDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const isFuture = startDate > today;
            return (
              <tr
                key={interview.id}
                className={isFuture ? "future-interview-row" : ""}
              >
                <td>{interview.NIC}</td>
                <td>{interview.name}</td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      title={interview.email}
                      style={{
                        display: "inline-block",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {interview.email}
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      style={{ fontSize: "1em", flexShrink: 0 }}
                      onClick={() =>
                        navigator.clipboard.writeText(interview.email)
                      }
                      title="Copy email"
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                </td>
                <td>{moment(interview.date).format("YYYY-MM-DD")}</td>
                <td style={{ verticalAlign: "middle" }}>
                  <div
                    className="d-flex justify-content-center"
                    style={{ height: "100%" }}
                  >
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => handleShowDetails(interview)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i> Details
                    </button>
                    <img
                      alt="Edit"
                      className="btn btn-sm btn-outline-secondary me-2"
                      style={{ width: "auto", height: "34px" }}
                      onClick={() => navigate(`${interview.NIC}/edit`)}
                      src={editIcon}
                    />
                    <img
                      alt="Delete"
                      style={{ width: "auto", height: "34px" }}
                      onClick={() => handleDelete(interview.NIC)}
                      className="btn btn-sm btn-outline-secondary"
                      src={removeIcon}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container-fluid px-4">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Last 7 Days Interviews</h5>
        </div>
        <div className="card-body">
          {/* Search bar for Last 7 Days */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by NIC, Name, or Email..."
                  value={lastSevenDaysFilter}
                  onChange={(e) => setLastSevenDaysFilter(e.target.value)}
                />
                {lastSevenDaysFilter && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setLastSevenDaysFilter("")}
                    title="Clear filter"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filterInterviews(lastSevenDays, lastSevenDaysFilter).length > 0 ? (
            renderTable(
              filterInterviews(lastSevenDays, lastSevenDaysFilter),
              "Last 7 Days Interviews"
            )
          ) : lastSevenDaysFilter ? (
            <p className="text-muted">
              No interviews match your search criteria
            </p>
          ) : (
            <p className="text-muted">No interviews in the last 7 days</p>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div
          className="card-header d-flex justify-content-between align-items-center"
          style={{ cursor: "pointer" }}
          onClick={() => setShowallInterviews(!showallInterviews)}
        >
          <h5 className="mb-0">All Interviews</h5>
          <i
            className={`bi bi-chevron-${showallInterviews ? "up" : "down"}`}
          ></i>
        </div>
        {showallInterviews && (
          <div className="card-body">
            {/* Search bar for All Interviews */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by NIC, Name, or Email..."
                    value={allInterviewsFilter}
                    onChange={(e) => setAllInterviewsFilter(e.target.value)}
                  />
                  {allInterviewsFilter && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setAllInterviewsFilter("")}
                      title="Clear filter"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filterInterviews(allInterviews, allInterviewsFilter).length > 0 ? (
              renderTable(
                filterInterviews(allInterviews, allInterviewsFilter),
                "All Interviews"
              )
            ) : allInterviewsFilter ? (
              <p className="text-muted">
                No interviews match your search criteria
              </p>
            ) : (
              <p className="text-muted">No interviews</p>
            )}
          </div>
        )}
      </div>

      {/* Bootstrap Modal for Interview Details */}
      {showModal && selectedInterview && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="interviewDetailsModal"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="interviewDetailsModal">
                  Interview Details - {selectedInterview.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Basic Information</h6>
                    <p>
                      <strong>NIC:</strong> {selectedInterview.NIC}
                    </p>
                    <p>
                      <strong>Name:</strong> {selectedInterview.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedInterview.email}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {moment(selectedInterview.date).format("YYYY-MM-DD")}
                    </p>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {selectedInterview.duration || "Not specified"}
                    </p>
                    <p>
                      <strong>Interview Date:</strong>{" "}
                      {moment(selectedInterview.createdAt).format("YYYY-MM-DD")}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Departments</h6>
                    {selectedInterview.departments.length > 0 ? (
                      selectedInterview.departments.map((dept, index) => (
                        <div key={dept.id} className="mb-2">
                          <p className="mb-1">
                            <strong>
                              {departmentNames[dept.id] ||
                                `Department ${dept.id}`}
                            </strong>
                          </p>
                          {dept.fromDate && dept.toDate && (
                            <p className="text-muted small mb-0">
                              From: {moment(dept.fromDate).format("YYYY-MM-DD")}
                              <br />
                              To: {moment(dept.toDate).format("YYYY-MM-DD")}
                            </p>
                          )}
                          {index < selectedInterview.departments.length - 1 && (
                            <hr />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No departments assigned</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    navigate(`${selectedInterview.NIC}/edit`);
                    handleCloseModal();
                  }}
                >
                  Edit Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
