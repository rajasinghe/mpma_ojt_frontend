import { useState, useEffect } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { Link, useLoaderData } from "react-router-dom";
import MiniLoader from "../Components/ui/Loader/MiniLoader";
import moment from "moment";
import api from "../api";
import { Modal, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Swal from "sweetalert2";

// Form validation schema
const createAccountSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional(),
    nic: z.string().optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

const TraineesWithoutPortalAccounts = async () => {
  const [traineesWithoutPortalAccounts] = await Promise.all([
    api.get("api/trainee/without-portal-account"),
  ]);

  return traineesWithoutPortalAccounts.data;
};

const PendingTrainees = async () => {
  try {
    const response = await api.get("api/portal/pending_trainees");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching pending trainees:", error);
    return [];
  }
};

//console.log("pending trainees", PendingTrainees.data);

type RegisteredTrainee = {
  id: number;
  NIC: string;
  nickname: string;
  username: string;
  status: string;
  Name: string;
  email: string;
  start_date: string;
};

export default function PortalAccountPage() {
  const registeredTrainees = useLoaderData() as RegisteredTrainee[];
  const [traineesWithoutPortalAccounts, setTraineesWithoutPortalAccounts] =
    useState<any[]>([]);
  const [pendingTrainees, setPendingTrainees] = useState<any[]>([]);
  const [searchRegistered, setSearchRegistered] = useState("");
  const [searchPending, setSearchPending] = useState("");
  const [loadingPending, setLoadingPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [selectedPendingTrainees, setSelectedPendingTrainees] = useState<
    string[]
  >([]);
  const [emailSentTrainees, setEmailSentTrainees] = useState<{
    [key: string]: number;
  }>({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTraineeForAccount, setSelectedTraineeForAccount] =
    useState<any>(null);
  const [selectedTraineeForEdit, setSelectedTraineeForEdit] =
    useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    mode: "onBlur",
  });

  const handleSelectTrainee = (nic: string) => {
    setSelectedTrainees((prev) =>
      prev.includes(nic) ? prev.filter((id) => id !== nic) : [...prev, nic]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const traineesWithEmail = traineesWithoutPortalAccounts.filter(
      (t) => t.email
    );
    if (e.target.checked) {
      setSelectedTrainees(traineesWithEmail.map((t) => t.NIC_NO));
    } else {
      setSelectedTrainees([]);
    }
  };

  // Check if email was sent within last 2 minutes
  const isEmailRecentlySent = (email: string) => {
    const sentTime = emailSentTrainees[email];
    if (!sentTime) return false;
    return Date.now() - sentTime < 2 * 60 * 1000; // 2 minutes
  };

  const sendBulkEmails = async () => {
    if (selectedTrainees.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Selection",
        text: "Please select at least one trainee to send emails.",
      });
      return;
    }

    // Create array of email and NIC pairs
    const selectedTraineesData = traineesWithoutPortalAccounts
      .filter((t) => selectedTrainees.includes(t.NIC_NO))
      .map((t) => ({
        email: t.email,
        NIC: t.NIC_NO,
      }));

    const confirm = await Swal.fire({
      title: "Send Bulk Emails?",
      text: `Send login details to ${selectedTraineesData.length} trainees?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send all",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.post("api/trainee/sendMails", {
          data: selectedTraineesData,
        });

        setSelectedTrainees([]);

        Swal.fire({
          icon: "success",
          title: "Bulk Emails Sent!",
          text: `Emails successfully sent to ${selectedTraineesData.length} trainees`,
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

  // Pending trainees functions
  const handleSelectPendingTrainee = (nic: string) => {
    setSelectedPendingTrainees((prev) =>
      prev.includes(nic) ? prev.filter((id) => id !== nic) : [...prev, nic]
    );
  };

  const handleSelectAllPending = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPendingTrainees(filteredPendingTrainees.map((t) => t.NIC));
    } else {
      setSelectedPendingTrainees([]);
    }
  };

  const sendPendingEmail = async (email: string, NIC: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Send login details to ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send it",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.post("api/trainee/sendMails", {
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
      } catch (error) {
        console.error("Error sending email:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: `Could not send email to ${email}.`,
        });
      }
    }
  };

  const sendBulkPendingEmails = async () => {
    if (selectedPendingTrainees.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Selection",
        text: "Please select at least one trainee to send emails.",
      });
      return;
    }

    // Create array of email and NIC pairs
    const selectedTraineesData = pendingTrainees
      .filter((t) => selectedPendingTrainees.includes(t.NIC))
      .map((t) => ({
        email: t.email,
        NIC: t.NIC,
      }));

    const confirm = await Swal.fire({
      title: "Send Bulk Emails?",
      text: `Send login details to ${selectedTraineesData.length} trainees?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send all",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.post("api/trainee/sendMails", {
          data: selectedTraineesData,
        });

        // Mark all emails as sent with timestamp
        const now = Date.now();
        setEmailSentTrainees((prev) => {
          const updated = { ...prev };
          selectedTraineesData.forEach((item) => {
            updated[item.email] = now;
          });
          return updated;
        });

        setSelectedPendingTrainees([]);

        Swal.fire({
          icon: "success",
          title: "Bulk Emails Sent!",
          text: `Emails successfully sent to ${selectedTraineesData.length} trainees`,
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

  const openCreateAccountModal = (trainee: any) => {
    setSelectedTraineeForAccount(trainee);
    setShowModal(true);
    reset(); // Reset form when opening modal
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTraineeForAccount(null);
    reset();
  };

  const onSubmitCreateAccount = async (data: CreateAccountFormData) => {
    setIsSubmitting(true);
    try {
      let requestData;

      if (selectedTraineeForAccount) {
        // Creating account for existing trainee
        requestData = {
          nic: selectedTraineeForAccount.NIC_NO,
          email: selectedTraineeForAccount.email,
          name: selectedTraineeForAccount.name,
          username: data.username,
          password: data.password,
        };
      } else {
        // Creating completely new user account
        if (!data.name || !data.email || !data.nic) {
          await Swal.fire({
            title: "Missing Information!",
            text: "Please fill in all required fields (Name, Email, NIC)",
            icon: "warning",
            confirmButtonText: "OK",
          });
          setIsSubmitting(false);
          return;
        }

        requestData = {
          nic: data.nic,
          email: data.email,
          name: data.name,
          username: data.username,
          password: data.password,
        };
      }

      const response = await api.post(
        "api/trainee/create-account",
        requestData
      );

      console.log(response.data.message);

      // Show success message
      await Swal.fire({
        title: "Success!",
        text: response.data.message,
        icon: "success",
        confirmButtonText: "OK",
      });

      // Close modal and refresh data
      closeModal();

      // Refresh the trainees list
      const updatedTrainees = await TraineesWithoutPortalAccounts();
      setTraineesWithoutPortalAccounts(
        Array.isArray(updatedTrainees) ? updatedTrainees : []
      );
    } catch (error: any) {
      console.error(error);

      // Show error message
      await Swal.fire({
        title: "Error!",
        text:
          error.response?.data?.message || "Failed to create portal account",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit trainee functionality
  const openEditModal = (trainee: any) => {
    setSelectedTraineeForEdit(trainee);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTraineeForEdit(null);
  };

  const handleEditTrainee = async (trainee: any) => {
    // This would typically open a form to edit trainee details
    // For now, we'll show a simple prompt to edit email
    const { value: newEmail } = await Swal.fire({
      title: "Edit Trainee Email",
      input: "email",
      inputLabel: "Email address",
      inputValue: trainee.email,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    if (newEmail) {
      try {
        const response = await api.put(
          `api/trainee/update-email/${trainee.NIC}`,
          {
            email: newEmail,
          }
        );

        // Update the pending trainees list
        setPendingTrainees((prev) =>
          prev.map((t) =>
            t.NIC === trainee.NIC ? { ...t, email: newEmail } : t
          )
        );

        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: `Email updated successfully to ${newEmail}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error updating email:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Could not update email.",
        });
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    setLoadingPending(true);
    Promise.all([TraineesWithoutPortalAccounts(), PendingTrainees()])
      .then(([traineesResult, pendingResult]) => {
        // Handle trainees without portal accounts
        if (!Array.isArray(traineesResult)) {
          setTraineesWithoutPortalAccounts([]);
        } else {
          setTraineesWithoutPortalAccounts(traineesResult);
        }

        // Handle pending trainees
        if (!Array.isArray(pendingResult)) {
          setPendingTrainees([]);
        } else {
          setPendingTrainees(pendingResult);
        }

        setLoading(false);
        setLoadingPending(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
        setLoadingPending(false);
      });
  }, []);

  const validateUsername = async (username: string) => {
    if (!username || username.length < 3) return true; // Let Zod handle basic validation

    try {
      const response = await api.get(`api/trainee/username/${username}`);
      return !response.data.exists || "Username already exists";
    } catch (error) {
      return "Error checking username availability";
    }
  };

  // Filtered pending trainees - exclude registered trainees from pending trainees
  const filteredPendingTrainees = pendingTrainees
    .filter(
      (pendingTrainee) =>
        !registeredTrainees.some(
          (registeredTrainee) => registeredTrainee.NIC === pendingTrainee.NIC
        )
    )
    .filter(
      (t) =>
        t.NIC?.toLowerCase().includes(searchPending.toLowerCase()) ||
        t.name?.toLowerCase().includes(searchPending.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchPending.toLowerCase())
    );

  console.log("traineesWithoutPortalAccounts", registeredTrainees);

  return (
    <MainContainer
      title="Portal Account"
      breadCrumbs={["Home", "Trainees", "Portal Account"]}
    >
      <SubContainer>
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-person-plus-fill me-2"></i>
              <h5 className="card-title mb-0">Create Portal Account</h5>
              <button
                className="btn btn-success mx-2 ms-auto"
                onClick={() => openCreateAccountModal(null)}
              >
                Create New
              </button>
            </div>
          </div>
          {loading ? (
            <MiniLoader />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Search registered trainees..."
                  value={searchRegistered}
                  onChange={(e) => setSearchRegistered(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {selectedTrainees.length > 0 && (
                      <div className="mb-3">
                        <button
                          className="btn btn-primary me-2"
                          onClick={sendBulkEmails}
                        >
                          Send Bulk Emails ({selectedTrainees.length})
                        </button>
                        <button
                          className="btn btn-warning me-2"
                          //onClick={() => setShowScheduleModal(true)}
                        >
                          Schedule Emails
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className=" table-responsive rounded-2  table-scrollbar">
                {traineesWithoutPortalAccounts.length == 0 ? (
                  <div className="text-black-50 text-center m-3"> </div>
                ) : (
                  <table
                    className="table table-sm table-bordered w-100 table-striped align-middle text-center"
                    style={{ fontSize: "0.875rem" }}
                  >
                    <thead className="table-dark position-sticky top-0">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              selectedTrainees.length ===
                                traineesWithoutPortalAccounts.filter(
                                  (t) => t.email
                                ).length &&
                              traineesWithoutPortalAccounts.filter(
                                (t) => t.email
                              ).length > 0
                            }
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>NIC</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Institute</th>
                        <th>Start Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traineesWithoutPortalAccounts
                        .sort((a, b) => {
                          if (a.email && !b.email) return -1;
                          if (!a.email && b.email) return 1;
                          return 0;
                        })
                        .map((trainee, idx) => (
                          <tr key={idx}>
                            <td>
                              {trainee.email ? (
                                <input
                                  type="checkbox"
                                  checked={selectedTrainees.includes(
                                    trainee.NIC_NO
                                  )}
                                  onChange={() =>
                                    handleSelectTrainee(trainee.NIC_NO)
                                  }
                                />
                              ) : null}
                            </td>
                            <td>{trainee.NIC_NO}</td>
                            <td>{trainee.name}</td>
                            <td
                              style={{
                                maxWidth:
                                  window.innerWidth >= 1200 ? "200px" : "auto",
                                overflow:
                                  window.innerWidth >= 1200
                                    ? "hidden"
                                    : "visible",
                                textOverflow:
                                  window.innerWidth >= 1200
                                    ? "ellipsis"
                                    : "initial",
                                whiteSpace:
                                  window.innerWidth >= 1200
                                    ? "nowrap"
                                    : "normal",
                              }}
                            >
                              {trainee?.email || "No email"}
                            </td>
                            <td
                              style={{
                                maxWidth:
                                  window.innerWidth >= 1200 ? "200px" : "auto",
                                overflow:
                                  window.innerWidth >= 1200
                                    ? "hidden"
                                    : "visible",
                                textOverflow:
                                  window.innerWidth >= 1200
                                    ? "ellipsis"
                                    : "initial",
                                whiteSpace:
                                  window.innerWidth >= 1200
                                    ? "nowrap"
                                    : "normal",
                              }}
                            >
                              {trainee.institute_name}
                            </td>
                            <td>
                              {moment(trainee.start_date).format("YYYY-MM-DD")}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary me-1 m-1"
                                onClick={() => openCreateAccountModal(trainee)}
                              >
                                Create
                              </button>
                              <Link
                                className={"btn btn-sm btn-warning"}
                                to={`/OJT/trainees/${trainee.id}/profile`}
                                style={{ width: "57px" }}
                              >
                                Profile
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pending Trainees Section */}
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-person-check-fill me-2"></i>
              <h5 className="card-title mb-0">Pending Trainees</h5>
            </div>
          </div>
          {loadingPending ? (
            <div className="text-black-50 text-center m-3">
              No pending trainees
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-center">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Search pending trainees..."
                value={searchPending}
                onChange={(e) => setSearchPending(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {selectedPendingTrainees.length > 0 && (
                    <div className="mb-3">
                      <button
                        className="btn btn-primary me-2"
                        onClick={sendBulkPendingEmails}
                      >
                        Resend Emails ({selectedPendingTrainees.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {filteredPendingTrainees.length === 0 ? (
            <div className="text-black-50 text-center m-3">
              No pending trainees
            </div>
          ) : (
            <div className="table-responsive rounded-2 table-scrollbar">
              <table
                className="table table-sm table-bordered w-100 table-striped align-middle text-center"
                style={{ fontSize: "0.875rem" }}
              >
                <thead className="table-dark position-sticky top-0">
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          selectedPendingTrainees.length ===
                            filteredPendingTrainees.length &&
                          filteredPendingTrainees.length > 0
                        }
                        onChange={handleSelectAllPending}
                      />
                    </th>
                    <th>NIC</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingTrainees.map((trainee, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPendingTrainees.includes(
                            trainee.NIC
                          )}
                          onChange={() =>
                            handleSelectPendingTrainee(trainee.NIC)
                          }
                        />
                      </td>
                      <td>{trainee.NIC}</td>
                      <td>{trainee.nickname}</td>
                      <td>{trainee.email || "No email"}</td>
                      <td>{moment(trainee.date).format("YYYY-MM-DD")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-1 m-1"
                          onClick={() =>
                            sendPendingEmail(trainee.email, trainee.NIC)
                          }
                          disabled={isEmailRecentlySent(trainee.email)}
                          title={
                            isEmailRecentlySent(trainee.email)
                              ? "Email sent recently. Please wait 2 minutes."
                              : "Send email"
                          }
                        >
                          {isEmailRecentlySent(trainee.email)
                            ? "Wait..."
                            : "Resend"}
                        </button>
                        <button
                          className="btn btn-sm btn-warning me-1 m-1"
                          onClick={() => handleEditTrainee(trainee)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-people-fill me-2"></i>
              <h5 className="card-title mb-0">Portal Created Trainees</h5>
            </div>
          </div>
          {registeredTrainees.length == 0 ? (
            <div className="text-black-50 text-center m-3">
              No registered trainees
            </div>
          ) : (
            <>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Search registered trainees..."
                value={searchRegistered}
                onChange={(e) => setSearchRegistered(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <div className="table-responsive rounded-2 table-scrollbar">
                <table
                  className="table table-sm table-bordered w-100 table-striped align-middle text-center"
                  style={{ fontSize: "0.875rem" }}
                >
                  <thead className="table-dark position-sticky top-0">
                    <tr>
                      <th>NIC</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Start Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredTrainees.map((trainee, idx) => (
                      <tr key={idx}>
                        <td>{trainee.NIC}</td>
                        <td>{trainee.nickname}</td>
                        <td>{trainee?.email || "No email"}</td>
                        <td>
                          {moment(trainee.start_date).format("YYYY-MM-DD")}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-success me-1">
                            Register
                          </button>
                          <button className="btn btn-sm btn-info me-1">
                            View
                          </button>
                          <button className="btn btn-sm btn-danger">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </SubContainer>

      {/* Create Account Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedTraineeForAccount
              ? "Create Portal Account"
              : "Create New User Account"}
          </Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit(onSubmitCreateAccount)}>
          <Modal.Body>
            {selectedTraineeForAccount ? (
              <div className="mb-3">
                <h6>Creating account for:</h6>
                <p className="text-muted">
                  <strong>Name:</strong> {selectedTraineeForAccount.name}
                  <br />
                  <strong>NIC:</strong> {selectedTraineeForAccount.NIC_NO}
                  <br />
                  <strong>Email:</strong> {selectedTraineeForAccount.email}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    id="name"
                    placeholder="Enter full name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">
                      {errors.name.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    id="email"
                    placeholder="Enter email address"
                    {...register("email")}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">
                      {errors.email.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="nic" className="form-label">
                    NIC Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.nic ? "is-invalid" : ""}`}
                    id="nic"
                    placeholder="Enter NIC number"
                    {...register("nic")}
                  />
                  {errors.nic && (
                    <div className="invalid-feedback">{errors.nic.message}</div>
                  )}
                </div>
              </>
            )}

            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${
                  errors.username ? "is-invalid" : ""
                }`}
                id="username"
                placeholder="Enter username"
                {...register("username", {
                  validate: validateUsername,
                })}
              />
              {errors.username && (
                <div className="invalid-feedback">
                  {errors.username.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                id="password"
                placeholder="Enter password"
                {...register("password")}
              />
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password.message}
                </div>
              )}
              <div className="form-text">
                Password must be at least 8 characters with uppercase,
                lowercase, and number.
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control ${
                  errors.confirmPassword ? "is-invalid" : ""
                }`}
                id="confirmPassword"
                placeholder="Confirm password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </MainContainer>
  );
}
