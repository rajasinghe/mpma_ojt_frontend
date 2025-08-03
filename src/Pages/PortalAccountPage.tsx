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
  const [searchRegistered, setSearchRegistered] = useState("");
  const [loadingRegistered, setLoadingRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTraineeForAccount, setSelectedTraineeForAccount] =
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
    if (!selectedTraineeForAccount) return;

    setIsSubmitting(true);
    try {
      const response = await api.post("api/trainee/create-account", {
        nic: selectedTraineeForAccount.NIC_NO,
        email: selectedTraineeForAccount.email,
        name: selectedTraineeForAccount.name,
        username: data.username,
        password: data.password,
      });

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

  useEffect(() => {
    setLoading(true);
    TraineesWithoutPortalAccounts().then((result) => {
      if (!Array.isArray(result)) {
        setLoading(false);
        setTraineesWithoutPortalAccounts([]);
      } else if (Array.isArray(result)) {
        setTraineesWithoutPortalAccounts(result);
        setLoading(false);
      }
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

  console.log("traineesWithoutPortalAccounts", registeredTrainees);

  return (
    <MainContainer
      title="Portal Account"
      breadCrumbs={["Home", "Trainees", "Portal Account"]}
    >
      <SubContainer>
        <div className="card shadow-sm mb-3">
          <div className="card-body d-flex align-items-center">
            <i className="bi bi-person-plus-fill me-2"></i>
            <h5 className="card-title mb-0">Create Portal Account</h5>
            <button className="btn btn-outline-primary mx-2 ms-auto">
              Create New
            </button>
          </div>
        </div>
        {traineesWithoutPortalAccounts.length == 0 ? (
          <div className="text-black-50 text-center m-3"> </div>
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
              {loading ? (
                <MiniLoader />
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
                            traineesWithoutPortalAccounts.filter((t) => t.email)
                              .length > 0
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
                          <td>{trainee?.email || "No email"}</td>
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
                                window.innerWidth >= 1200 ? "nowrap" : "normal",
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

        <div className="card shadow-sm mb-3 mt-5">
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
            <div className="table-responsive">
              {loadingRegistered ? (
                <MiniLoader />
              ) : (
                <table className="table table-sm table-bordered w-100 table-striped align-middle text-center">
                  <thead className="table-dark">
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
                        <td>{trainee.Name}</td>
                        <td>{trainee.email}</td>
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
              )}
            </div>
          </>
        )}
      </SubContainer>

      {/* Create Account Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Portal Account</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit(onSubmitCreateAccount)}>
          <Modal.Body>
            {selectedTraineeForAccount && (
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
