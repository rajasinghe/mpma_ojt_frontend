import { useState, useEffect } from "react";
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

interface EmailDetail {
  id: number;
  NIC: string;
  type: "login" | "documents";
  count: number;
  createdAt: string;
  updatedAt: string;
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

  // Processing states for buttons
  const [processingEmails, setProcessingEmails] = useState<{
    [key: string]: boolean;
  }>({});
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Email details from backend
  const [emailDetails, setEmailDetails] = useState<EmailDetail[]>([]);

  // Track disabled states for 2-minute cooldown
  const [disabledEmails, setDisabledEmails] = useState<{
    [key: string]: { timestamp: number; type: "login" | "documents" };
  }>({});

  const navigate = useNavigate();

  // Fetch email details on component mount
  useEffect(() => {
    const fetchEmailDetails = async () => {
      try {
        const response = await api.get("api/interview/email-details");
        setEmailDetails(response.data.emailDetails || []);
      } catch (error) {
        console.error("Error fetching email details:", error);
      }
    };

    fetchEmailDetails();
  }, []);

  // Clean up expired disabled states every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDisabledEmails((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((key) => {
          if (now - updated[key].timestamp >= 2 * 60 * 1000) {
            // 2 minutes
            delete updated[key];
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

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
      // Only select interviews that are not disabled
      const enabledInterviews = interviewsWithEmail.filter((interview) => {
        const emailType = showLoginDetailsTable ? "login" : "documents";
        const isDisabledLocally = isEmailDisabledLocally(
          interview.email,
          emailType
        );
        const isRecentlySentLogin = isEmailRecentlySentFromBackend(
          interview.NIC,
          "login"
        );
        const isRecentlySentDocuments = isEmailRecentlySentFromBackend(
          interview.NIC,
          "documents"
        );
        const isDisabled =
          isDisabledLocally ||
          isRecentlySentLogin ||
          isRecentlySentDocuments ||
          isBulkProcessing;
        return !isDisabled;
      });
      setSelectedAllInterviews(
        enabledInterviews.map((interview) => interview.NIC)
      );
    } else {
      setSelectedAllInterviews([]);
    }
  };

  // Helper functions for email details
  const getEmailDetail = (NIC: string, type: "login" | "documents") => {
    return emailDetails.find(
      (detail) => detail.NIC === NIC && detail.type === type
    );
  };

  const isEmailRecentlySentFromBackend = (
    NIC: string,
    type: "login" | "documents"
  ) => {
    const emailDetail = getEmailDetail(NIC, type);
    if (!emailDetail) return false;

    const updatedTime = new Date(emailDetail.updatedAt).getTime();
    const currentTime = Date.now();
    return currentTime - updatedTime < 2 * 60 * 1000; // 2 minutes
  };

  const hasEmailBeenSent = (NIC: string, type: "login" | "documents") => {
    const emailDetail = getEmailDetail(NIC, type);
    return emailDetail && emailDetail.count > 0;
  };

  // Check if email is disabled due to local 2-minute cooldown (any type disables both)
  const isEmailDisabledLocally = (
    email: string,
    type: "login" | "documents"
  ) => {
    const disabledInfo = disabledEmails[email];
    if (!disabledInfo) return false;

    const now = Date.now();
    return now - disabledInfo.timestamp < 2 * 60 * 1000; // 2 minutes
  };

  // Get email send count for display
  const getEmailSendCount = (NIC: string, type: "login" | "documents") => {
    const emailDetail = getEmailDetail(NIC, type);
    return emailDetail ? emailDetail.count : 0;
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
        name: interview.name,
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
      // Set bulk processing state and disable all send mail buttons
      setIsBulkProcessing(true);
      const allEmails = selectedInterviewsData.reduce((acc, item) => {
        acc[item.email] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setProcessingEmails(allEmails);

      try {
        const endpoint = showLoginDetailsTable
          ? "api/interview/sendMails"
          : "api/interview/sendDocumentRequirements";

        await api.post(endpoint, {
          data: selectedInterviewsData,
        });

        setSelectedAllInterviews([]);

        // Set 2-minute cooldown for all emails that were sent (disables both login and document buttons)
        const emailType = showLoginDetailsTable ? "login" : "documents";
        const now = Date.now();
        const newDisabledEmails = selectedInterviewsData.reduce((acc, item) => {
          acc[item.email] = { timestamp: now, type: emailType };
          return acc;
        }, {} as { [key: string]: { timestamp: number; type: "login" | "documents" } });

        setDisabledEmails((prev) => ({ ...prev, ...newDisabledEmails }));

        // Refresh email details after successful bulk send
        const response = await api.get("api/interview/email-details");
        setEmailDetails(response.data.emailDetails || []);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message[0] ||
          error.message ||
          "An unexpected error occurred while sending the email";
        console.error("Error sending bulk emails:", error);
        Swal.fire({
          icon: "error",
          title: "Send bulk emails Failed!",
          text: `${errorMessage}.`,
        });
      } finally {
        // Reset processing states
        setIsBulkProcessing(false);
        setProcessingEmails({});
      }
    }
  };

  const sendSingleEmail = async (
    email: string,
    NIC: string,
    name: string,
    isResend: boolean = false
  ) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: showLoginDetailsTable
        ? isResend
          ? `Resend login details to ${email}?`
          : `Send login details to ${email}?`
        : isResend
        ? `Resend document requirements to ${email}?`
        : `Send document requirements to ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isResend ? "Yes, resend it" : "Yes, send it",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      // Set processing state for this specific email
      setProcessingEmails((prev) => ({
        ...prev,
        [email]: true,
      }));

      try {
        const endpoint = showLoginDetailsTable
          ? "api/interview/sendMails"
          : "api/interview/sendDocumentRequirements";

        await api.post(endpoint, {
          data: [
            {
              email: email,
              NIC: NIC,
              name: name,
            },
          ],
        });

        // Set 2-minute cooldown for this email (disables both login and document buttons)
        const emailType = showLoginDetailsTable ? "login" : "documents";
        setDisabledEmails((prev) => ({
          ...prev,
          [email]: { timestamp: Date.now(), type: emailType },
        }));

        // Refresh email details after successful send
        const response = await api.get("api/interview/email-details");
        setEmailDetails(response.data.emailDetails || []);
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
      } finally {
        // Reset processing state for this email
        setProcessingEmails((prev) => {
          const newState = { ...prev };
          delete newState[email];
          return newState;
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

    // Get only enabled (non-disabled) interviews for "Select All" logic
    const enabledInterviews = interviewsWithEmail.filter((interview) => {
      const emailType = showLoginDetailsTable ? "login" : "documents";
      const isDisabledLocally = isEmailDisabledLocally(
        interview.email,
        emailType
      );
      const isRecentlySentLogin = isEmailRecentlySentFromBackend(
        interview.NIC,
        "login"
      );
      const isRecentlySentDocuments = isEmailRecentlySentFromBackend(
        interview.NIC,
        "documents"
      );
      const isDisabled =
        isDisabledLocally ||
        isRecentlySentLogin ||
        isRecentlySentDocuments ||
        isBulkProcessing;
      return !isDisabled;
    });

    return (
      <div
        className="table-responsive"
        style={{ maxHeight: "53vh", overflowY: "auto" }}
      >
        <table className="table table-striped table-sm table-bordered table-hover">
          <thead className="table-dark sticky-top">
            <tr className="small">
              <th>
                <input
                  type="checkbox"
                  checked={
                    enabledInterviews.length > 0 &&
                    enabledInterviews.every((interview) =>
                      selectedInterviews.includes(interview.NIC)
                    )
                  }
                  onChange={handleSelectAll}
                  title="Select all enabled trainees with email"
                  disabled={enabledInterviews.length === 0}
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
                    {interview.email
                      ? (() => {
                          const emailType = showLoginDetailsTable
                            ? "login"
                            : "documents";
                          const isDisabledLocally = isEmailDisabledLocally(
                            interview.email,
                            emailType
                          );
                          const isRecentlySentLogin =
                            isEmailRecentlySentFromBackend(
                              interview.NIC,
                              "login"
                            );
                          const isRecentlySentDocuments =
                            isEmailRecentlySentFromBackend(
                              interview.NIC,
                              "documents"
                            );
                          const isDisabled =
                            isDisabledLocally ||
                            isRecentlySentLogin ||
                            isRecentlySentDocuments ||
                            isBulkProcessing;

                          return (
                            <input
                              type="checkbox"
                              checked={selectedInterviews.includes(
                                interview.NIC
                              )}
                              onChange={() =>
                                handleSelectInterview(interview.NIC)
                              }
                              disabled={isDisabled}
                              title={
                                isDisabled
                                  ? "Cannot select while email sending is disabled"
                                  : ""
                              }
                            />
                          );
                        })()
                      : null}
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
                      {interview.email &&
                        (() => {
                          const emailType = showLoginDetailsTable
                            ? "login"
                            : "documents";
                          const hasBeenSent = hasEmailBeenSent(
                            interview.NIC,
                            emailType
                          );
                          const isRecentlySent = isEmailRecentlySentFromBackend(
                            interview.NIC,
                            emailType
                          );
                          // Check if any email type was recently sent from backend
                          const isRecentlySentLogin =
                            isEmailRecentlySentFromBackend(
                              interview.NIC,
                              "login"
                            );
                          const isRecentlySentDocuments =
                            isEmailRecentlySentFromBackend(
                              interview.NIC,
                              "documents"
                            );
                          const isAnyRecentlySent =
                            isRecentlySentLogin || isRecentlySentDocuments;

                          const isDisabledLocally = isEmailDisabledLocally(
                            interview.email,
                            emailType
                          );
                          const isProcessing =
                            processingEmails[interview.email];
                          const sendCount = getEmailSendCount(
                            interview.NIC,
                            emailType
                          );

                          return (
                            <button
                              className={`btn btn-sm ms-1 ${
                                hasBeenSent ? "btn-warning" : "btn-success"
                              }`}
                              onClick={() =>
                                sendSingleEmail(
                                  interview.email,
                                  interview.NIC,
                                  interview.name,
                                  hasBeenSent
                                )
                              }
                              disabled={
                                isAnyRecentlySent ||
                                isDisabledLocally ||
                                isProcessing ||
                                isBulkProcessing
                              }
                              title={
                                isAnyRecentlySent || isDisabledLocally
                                  ? "Email sent recently (wait 2 minutes)"
                                  : isProcessing
                                  ? "Sending email..."
                                  : isBulkProcessing
                                  ? "Bulk email in progress..."
                                  : hasBeenSent
                                  ? showLoginDetailsTable
                                    ? "Resend login details"
                                    : "Resend document requirements"
                                  : showLoginDetailsTable
                                  ? "Send login details"
                                  : "Send document requirements"
                              }
                            >
                              {isProcessing ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-1"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  Processing...
                                </>
                              ) : hasBeenSent ? (
                                sendCount > 1 ? (
                                  `Resend(${sendCount})`
                                ) : (
                                  "Resend"
                                )
                              ) : (
                                "Send Mail"
                              )}
                            </button>
                          );
                        })()}
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
      {/* Search bar for All Interviews */}
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
        <div
          className="card mb-4"
          style={{ maxWidth: "1200px", margin: "0 auto" }}
        >
          <div className="card-header">
            <h5 className="mb-0">Interviews</h5>
          </div>
          <div className="card-body">
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
                  disabled={
                    selectedAllInterviews.length === 0 || isBulkProcessing
                  }
                  title={
                    isBulkProcessing
                      ? "Sending bulk emails..."
                      : selectedAllInterviews.length === 0
                      ? "Select trainees to send bulk emails"
                      : "Send bulk emails to selected trainees"
                  }
                >
                  {isBulkProcessing ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    `Send Bulk Emails (${selectedAllInterviews.length})`
                  )}
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
