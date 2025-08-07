import { useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
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
  allInterviews: Interview[];
  departmentNames: { [key: number]: string };
  showLoginDetailsTable: boolean;
  onToggleView: () => void;
}

export default function InterviewTables({
  allInterviews,
  departmentNames,
  showLoginDetailsTable,
  onToggleView,
}: Props) {
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [allInterviewsFilter, setAllInterviewsFilter] = useState("");

  // Email functionality states
  const [selectedAllInterviews, setSelectedAllInterviews] = useState<string[]>(
    []
  );
  const [emailSentTrainees, setEmailSentTrainees] = useState<{
    [key: string]: number;
  }>({});

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

  // Email functionality functions

  const handleSelectAllInterviews = (nic: string) => {
    setSelectedAllInterviews((prev) =>
      prev.includes(nic) ? prev.filter((id) => id !== nic) : [...prev, nic]
    );
  };

  const handleSelectAllAllInterviews = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const interviewsWithEmail = filterInterviews(
      allInterviews,
      allInterviewsFilter
    ).filter((interview) => interview.email);
    if (e.target.checked) {
      setSelectedAllInterviews(
        interviewsWithEmail.map((interview) => interview.NIC)
      );
    } else {
      setSelectedAllInterviews([]);
    }
  };

  // Check if email was sent within last 2 minutes
  const isEmailRecentlySent = (email: string) => {
    const sentTime = emailSentTrainees[email];
    if (!sentTime) return false;
    return Date.now() - sentTime < 2 * 60 * 1000; // 2 minutes
  };

  const sendBulkEmailsAllInterviews = async () => {
    if (selectedAllInterviews.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Selection",
        text: "Please select at least one trainee to send emails.",
      });
      return;
    }

    const selectedInterviewsData = filterInterviews(
      allInterviews,
      allInterviewsFilter
    )
      .filter((interview) => selectedAllInterviews.includes(interview.NIC))
      .map((interview) => ({
        email: interview.email,
        NIC: interview.NIC,
      }));

    const confirm = await Swal.fire({
      title: "Send Bulk Emails?",
      text: showLoginDetailsTable
        ? `Send login details to ${selectedInterviewsData.length} trainees?`
        : `Send document requirements to ${selectedInterviewsData.length} trainees?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send all",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const endpoint = showLoginDetailsTable
          ? "api/trainee/sendMails"
          : "api/trainee/sendDocumentRequirements";

        await api.post(endpoint, {
          data: selectedInterviewsData,
        });

        setSelectedAllInterviews([]);

        Swal.fire({
          icon: "success",
          title: "Bulk Emails Sent!",
          text: `Emails successfully sent to ${selectedInterviewsData.length} trainees`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error sending bulk emails:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Could not send bulk emails.",
        });
      }
    }
  };

  const sendSingleEmail = async (email: string, NIC: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: showLoginDetailsTable
        ? `Send login details to ${email}?`
        : `Send meeting schedule and document requirements to ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send it",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const endpoint = showLoginDetailsTable
          ? "api/trainee/sendMails"
          : "api/trainee/sendDocumentRequirements";

        await api.post(endpoint, {
          data: [
            {
              email: email,
              NIC: NIC,
            },
          ],
        });

        // Mark email as sent with timestamp
        setEmailSentTrainees((prev) => ({
          ...prev,
          [email]: Date.now(),
        }));

        Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: `Email successfully sent to ${email}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while sending the email";
        console.error("Error sending email:", errorMessage);
        Swal.fire({
          icon: "error",
          title: "Email Sending Failed!",
          text: `${errorMessage[0]}.`,
        });
      }
    }
  };

  const renderTable = (interviews: Interview[]) => {
    const selectedInterviews = selectedAllInterviews;
    const handleSelectInterview = handleSelectAllInterviews;
    const handleSelectAll = handleSelectAllAllInterviews;
    const currentFilter = allInterviewsFilter;

    const filteredInterviews = filterInterviews(interviews, currentFilter);
    const interviewsWithEmail = filteredInterviews.filter(
      (interview) => interview.email
    );

    return (
      <div className="table-responsive">
        <table className="table table-striped table-sm table-bordered table-hover">
          <thead className="table-dark">
            <tr className="small">
              <th>
                <input
                  type="checkbox"
                  checked={
                    selectedInterviews.length === interviewsWithEmail.length &&
                    interviewsWithEmail.length > 0
                  }
                  onChange={handleSelectAll}
                  title="Select all trainees with email"
                />
              </th>
              <th>NIC</th>
              <th>Name</th>
              <th>Email</th>
              <th>Start Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterviews.map((interview) => {
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
                  <td>
                    {interview.email ? (
                      <input
                        type="checkbox"
                        checked={selectedInterviews.includes(interview.NIC)}
                        onChange={() => handleSelectInterview(interview.NIC)}
                      />
                    ) : null}
                  </td>
                  <td>{interview.NIC}</td>
                  <td>{interview.name}</td>
                  <td>
                    {interview.email ? (
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
                            maxWidth: 150,
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
                    ) : (
                      <span className="text-muted">No email</span>
                    )}
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
                        Details
                      </button>
                      <button
                        className="btn btn-sm btn-success ms-1"
                        onClick={() =>
                          sendSingleEmail(interview.email, interview.NIC)
                        }
                        disabled={isEmailRecentlySent(interview.email)}
                        title={
                          isEmailRecentlySent(interview.email)
                            ? "Email sent recently"
                            : "Send login details"
                        }
                      >
                        Send Mails
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <div className="col-md-6 px-4 pb-2">
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
      <div className="container-fluid px-4">
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Interviews</h5>
          </div>
          <div className="card-body">
            {/* Search bar for All Interviews */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn interview-toggle-btn ${
                      showLoginDetailsTable ? "active" : ""
                    }`}
                    onClick={() => onToggleView()}
                  >
                    <i className="bi bi-key me-1"></i>
                    Login Details
                  </button>
                  <button
                    type="button"
                    className={`btn interview-toggle-btn ${
                      !showLoginDetailsTable ? "active" : ""
                    }`}
                    onClick={() => onToggleView()}
                  >
                    <i className="bi bi-folder me-1"></i>
                    Documents
                  </button>
                </div>
              </div>
              <div className="col-md-4 ms-auto d-flex justify-content-end">
                <button
                  className="btn btn-primary"
                  onClick={sendBulkEmailsAllInterviews}
                  disabled={selectedAllInterviews.length === 0}
                >
                  Send Bulk Emails ({selectedAllInterviews.length})
                </button>
              </div>
            </div>

            {filterInterviews(allInterviews, allInterviewsFilter).length > 0 ? (
              renderTable(filterInterviews(allInterviews, allInterviewsFilter))
            ) : allInterviewsFilter ? (
              <p className="text-muted">
                No interviews match your search criteria
              </p>
            ) : (
              <p className="text-muted">No interviews</p>
            )}
          </div>
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
                        {moment(selectedInterview.createdAt).format(
                          "YYYY-MM-DD"
                        )}
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
                                From:{" "}
                                {moment(dept.fromDate).format("YYYY-MM-DD")}
                                <br />
                                To: {moment(dept.toDate).format("YYYY-MM-DD")}
                              </p>
                            )}
                            {index <
                              selectedInterview.departments.length - 1 && (
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
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(selectedInterview.NIC)}
                  >
                    Delete Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
