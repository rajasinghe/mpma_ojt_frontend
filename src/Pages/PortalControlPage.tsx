import { useState, useEffect, useMemo } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { Link } from "react-router-dom";
import MiniLoader from "../Components/ui/Loader/MiniLoader";
import moment from "moment";
import api from "../api";
import { Modal, Button, Badge, Card, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Swal from "sweetalert2";

// Enhanced styles for better visual appeal
const styles = {
  pageHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  },
  searchContainer: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #e9ecef'
  },
  searchInput: {
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    padding: '12px 16px 12px 45px',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: 'none'
  },
  actionButton: {
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: 'none',
    fontSize: '14px',
    height: '600px',
    display: 'flex',
    flexDirection: 'column' as const
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: '#6c757d'
  }
};

// Dynamic form validation schema based on account creation mode
const createAccountSchemaWithEmail = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  nic: z.string().min(1, "NIC is required"),
});

const createAccountSchemaWithoutEmail = z
  .object({
    name: z.string().min(1, "Name is required"),
    nic: z.string().min(1, "NIC is required"),
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

// Combined type for form data
type CreateAccountFormData = z.infer<typeof createAccountSchemaWithEmail> &
  z.infer<typeof createAccountSchemaWithoutEmail>;

// Enhanced Loading Component
const TableSkeleton = () => (
  <div className="p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="d-flex align-items-center mb-3">
        <div className="bg-light rounded" style={{ width: '40px', height: '40px' }}></div>
        <div className="ms-3 flex-grow-1">
          <div className="bg-light rounded mb-2" style={{ height: '16px', width: '60%' }}></div>
          <div className="bg-light rounded" style={{ height: '14px', width: '40%' }}></div>
        </div>
        <div className="bg-light rounded" style={{ width: '80px', height: '32px' }}></div>
      </div>
    ))}
  </div>
);

// Enhanced Empty State Component
const EmptyState = ({ hasSearch, onClearSearch }: { hasSearch: boolean, onClearSearch: () => void }) => (
  <div style={styles.emptyState}>
    <div className="mb-4">
      <i className="bi bi-person-x" style={{ fontSize: '64px', color: '#dee2e6' }}></i>
    </div>
    <h5 className="mb-3">
      {hasSearch ? "No trainees found" : "No trainees without portal accounts"}
    </h5>
    <p className="text-muted mb-4">
      {hasSearch
        ? "Try adjusting your search criteria or clear the search to see all trainees."
        : "All trainees already have portal accounts created, or no trainees are registered yet."
      }
    </p>
    {hasSearch && (
      <button
        className="btn btn-outline-primary"
        onClick={onClearSearch}
        style={styles.actionButton}
      >
        <i className="bi bi-arrow-clockwise me-2"></i>
        Clear Search
      </button>
    )}
  </div>
);

const TraineesWithoutPortalAccounts = async () => {
  const [traineesWithoutPortalAccounts] = await Promise.all([
    api.get("api/portal/without-portal-account"),
  ]);

  return traineesWithoutPortalAccounts.data;
};

export default function PortalControlPage() {
  const [traineesWithoutPortalAccounts, setTraineesWithoutPortalAccounts] =
    useState<any[]>([]);
  const [searchRegistered, setSearchRegistered] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTraineeForAccount, setSelectedTraineeForAccount] =
    useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createWithEmail, setCreateWithEmail] = useState(true); // Toggle state for account creation mode

  // Form handling with dynamic schema
  const currentSchema = createWithEmail ? createAccountSchemaWithEmail : createAccountSchemaWithoutEmail;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(currentSchema),
    mode: "onBlur",
  });

  const handleSelectTrainee = (nic: string) => {
    setSelectedTrainees((prev) =>
      prev.includes(nic) ? prev.filter((id) => id !== nic) : [...prev, nic]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const traineesWithEmail = filteredTrainees.filter(
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
        name: t.name
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
        const response = await api.post("api/portal/sendMails", {
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
    // Set default mode based on whether trainee has email
    setCreateWithEmail(trainee ? !!trainee.email : true);
    reset(); // Reset form when opening modal
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTraineeForAccount(null);
    setCreateWithEmail(true); // Reset to default mode
    reset();
  };

  const onSubmitCreateAccount = async (data: CreateAccountFormData) => {
    setIsSubmitting(true);
    try {
      let requestData;

      if (selectedTraineeForAccount) {
        // Creating account for existing trainee
        if (createWithEmail) {
          // Email mode - send email with login details (for sendMails endpoint)
          requestData = {
            data: [{
              email: selectedTraineeForAccount.email,
              NIC: selectedTraineeForAccount.NIC_NO,
              name: selectedTraineeForAccount.name
            }]
          };
        } else {
          // Manual mode - create with username/password (for create-account endpoint)
          requestData = {
            nic: selectedTraineeForAccount.NIC_NO,
            name: selectedTraineeForAccount.name,
            username: data.username,
            password: data.password
          };
        }
      } else {
        // Creating completely new user account
        if (createWithEmail) {
          // Email mode (for sendMails endpoint)
          requestData = {
            data: [{
              email: data.email,
              NIC: data.nic,
              name: data.name
            }]
          };
        } else {
          // Manual mode (for create-account endpoint)
          requestData = {
            nic: data.nic,
            name: data.name,
            username: data.username,
            password: data.password
          };
        }
      }

      // Use different endpoints based on creation mode
      const endpoint = createWithEmail ? "api/portal/sendMails" : "api/portal/create-account";
      const response = await api.post(endpoint, requestData);

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

  // Edit trainee functionality - moved to PortalAccounts page

  useEffect(() => {
    setLoading(true);
    TraineesWithoutPortalAccounts()
      .then((traineesResult) => {
        if (!Array.isArray(traineesResult)) {
          setTraineesWithoutPortalAccounts([]);
        } else {
          setTraineesWithoutPortalAccounts(traineesResult);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  }, []);

  const validateUsername = async (username: string) => {
    if (!username || username.length < 3) return true; // Let Zod handle basic validation

    try {
      const response = await api.get(`api/portal/username/${username}`);
      return !response.data.exists || "Username already exists";
    } catch (error) {
      return "Error checking username availability";
    }
  };

  // Enhanced filtering with sorting
  const filteredTrainees = useMemo(() => {
    let filtered = traineesWithoutPortalAccounts;

    // Apply search filter
    if (searchRegistered) {
      filtered = filtered.filter(
        (t) =>
          t.NIC_NO?.toLowerCase().includes(searchRegistered.toLowerCase()) ||
          t.name?.toLowerCase().includes(searchRegistered.toLowerCase()) ||
          t.email?.toLowerCase().includes(searchRegistered.toLowerCase()) ||
          t.institute_name?.toLowerCase().includes(searchRegistered.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Always prioritize trainees with email first
      if (a.email && !b.email) return -1;
      if (!a.email && b.email) return 1;

      // Then sort by selected field
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [traineesWithoutPortalAccounts, searchRegistered, sortField, sortDirection]);

  const clearSearch = () => {
    setSearchRegistered("");
  };



  return (
    <MainContainer
      title="Portal Account Management"
      breadCrumbs={["Home", "Trainees", "Create Account"]}
    >
      <SubContainer>
        {/* Enhanced Page Header */}
        <div style={styles.pageHeader}>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <i className="bi bi-person-plus-fill me-3" style={{ fontSize: '32px' }}></i>
                <div>
                  <h3 className="mb-1">Portal Account Management</h3>
                  <p className="mb-0 opacity-75">
                    Create and manage portal accounts for trainees
                  </p>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <button
                className="btn btn-light btn-lg"
                onClick={() => openCreateAccountModal(null)}
                style={styles.actionButton}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create New Account
              </button>
            </Col>
          </Row>
        </div>
        {/* Enhanced Search and Filter Section */}
        <div style={styles.searchContainer}>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="position-relative">
                <i className="bi bi-search position-absolute"
                   style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }}></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by NIC, name, email, or institute..."
                  value={searchRegistered}
                  onChange={(e) => setSearchRegistered(e.target.value)}
                  style={styles.searchInput}
                />
                {searchRegistered && (
                  <button
                    className="btn btn-link position-absolute"
                    style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px', zIndex: 10 }}
                    onClick={clearSearch}
                  >
                    <i className="bi bi-x-circle text-muted"></i>
                  </button>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-end align-items-center gap-3">
                {searchRegistered && (
                  <Badge bg="info" style={{ borderRadius: '20px', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}>
                    <i className="bi bi-funnel me-1"></i>
                    {filteredTrainees.length} result{filteredTrainees.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                <button
                  className="btn btn-primary"
                  onClick={sendBulkEmails}
                  disabled={selectedTrainees.length === 0}
                  style={styles.actionButton}
                >
                  <i className="bi bi-envelope-fill me-2"></i>
                  Send Bulk Emails ({selectedTrainees.length})
                </button>
              </div>
            </Col>
          </Row>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          /* Enhanced Table Section */
          <Card style={styles.tableContainer}>
            <Card.Header className="bg-white border-0 py-2 flex-shrink-0">
              <Row className="align-items-center">
                <Col>
                  <h6 className="mb-0" style={{ fontSize: '16px' }}>
                    <i className="bi bi-people me-2 text-primary"></i>
                    Trainees Without Portal Accounts
                  </h6>
                </Col>
                <Col xs="auto">
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    Total: {filteredTrainees.length} |
                    With Email: {filteredTrainees.filter(t => t.email).length} |
                    Selected: {selectedTrainees.length}
                  </small>
                </Col>
              </Row>
            </Card.Header>

            {filteredTrainees.length === 0 ? (
              <EmptyState hasSearch={!!searchRegistered} onClearSearch={clearSearch} />
            ) : (
              <div className="table-responsive flex-grow-1" style={{ overflowY: 'auto' }}>
                <table className="table table-hover mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead className="table-light sticky-top">
                    <tr style={{ height: '40px' }}>
                      <th style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={
                            selectedTrainees.length === filteredTrainees.filter((t) => t.email).length &&
                            filteredTrainees.filter((t) => t.email).length > 0
                          }
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th style={{ width: '120px' }}>NIC</th>
                      <th style={{ width: '180px' }}>Name</th>
                      <th style={{ width: '220px' }}>Email</th>
                      <th style={{ width: '200px' }}>Institute</th>
                      <th style={{ width: '100px' }}>Start Date</th>
                      <th style={{ width: '160px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainees.map((trainee, idx) => (
                      <tr key={idx} className={!trainee.email ? 'table-warning' : ''} style={{ height: '45px' }}>
                        <td className="align-middle">
                          {trainee.email ? (
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedTrainees.includes(trainee.NIC_NO)}
                              onChange={() => handleSelectTrainee(trainee.NIC_NO)}
                            />
                          ) : (
                            <i className="bi bi-exclamation-triangle text-warning"
                               title="No email address"></i>
                          )}
                        </td>
                        <td className="align-middle">
                          <code className="text-dark" style={{ fontSize: '12px' }}>{trainee.NIC_NO}</code>
                        </td>
                        <td className="align-middle">
                          <span className="fw-medium text-truncate d-inline-block" style={{ maxWidth: '170px' }}>
                            {trainee.name}
                          </span>
                        </td>
                        <td className="align-middle">
                          {trainee.email ? (
                            <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '210px', fontSize: '13px' }}>
                              {trainee.email}
                            </span>
                          ) : (
                            <Badge bg="warning" text="dark" style={{ fontSize: '10px' }}>No Email</Badge>
                          )}
                        </td>
                        <td className="align-middle">
                          <span className="text-truncate d-inline-block" style={{ maxWidth: '190px', fontSize: '13px' }}>
                            {trainee.institute_name}
                          </span>
                        </td>
                        <td className="align-middle">
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            {moment(trainee.start_date).format("MMM DD, YY")}
                          </small>
                        </td>
                        <td className="align-middle">
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-primary"
                              onClick={() => openCreateAccountModal(trainee)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              <i className="bi bi-person-plus me-1"></i>
                              Create
                            </button>
                            <Link
                              className="btn btn-outline-secondary"
                              to={`/OJT/trainees/${trainee.id}/profile`}
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Other sections moved to Portal Accounts page */}
      </SubContainer>

      {/* Create Account Modal */}
      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <div className="d-flex align-items-center">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                 style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-person-plus" style={{ fontSize: '24px' }}></i>
            </div>
            <div>
              <Modal.Title className="mb-1">
                {selectedTraineeForAccount ? "Create Portal Account" : "Create New User Account"}
              </Modal.Title>
              <p className="text-muted mb-0 small">
                {selectedTraineeForAccount
                  ? "Create login credentials for existing trainee"
                  : "Add a new user with portal access"
                }
              </p>
            </div>
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit(onSubmitCreateAccount)}>
          <Modal.Body className="pt-3">
            {/* Account Creation Mode Toggle */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                <div>
                  <h6 className="mb-1">Account Creation Mode</h6>
                  <small className="text-muted">
                    {createWithEmail
                      ? "Send login details via email (auto-generated credentials)"
                      : "Create account with manual credentials"
                    }
                  </small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="createModeToggle"
                    checked={createWithEmail}
                    onChange={(e) => setCreateWithEmail(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="createModeToggle">
                    {createWithEmail ? "With Email" : "Manual Setup"}
                  </label>
                </div>
              </div>
            </div>

            {/* Existing Trainee Info Display */}
            {selectedTraineeForAccount && (
              <div className="mb-4 p-3 bg-info bg-opacity-10 rounded">
                <h6 className="text-info mb-2">
                  <i className="bi bi-info-circle me-2"></i>
                  Creating account for:
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedTraineeForAccount.name}
                  </div>
                  <div className="col-md-6">
                    <strong>NIC:</strong> {selectedTraineeForAccount.NIC_NO}
                  </div>
                  {selectedTraineeForAccount.email && (
                    <div className="col-12 mt-2">
                      <strong>Email:</strong> {selectedTraineeForAccount.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields Based on Mode */}
            {!selectedTraineeForAccount && (
              <>
                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    id="name"
                    placeholder="Enter full name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name.message}</div>
                  )}
                </div>

                {/* Email Field - Only show in email mode */}
                {createWithEmail && (
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      id="email"
                      placeholder="Enter email address"
                      {...register("email")}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>
                )}

                {/* NIC Field */}
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

            {/* Username and Password Fields - Only show in manual mode */}
            {!createWithEmail && (
              <>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.username ? "is-invalid" : ""}`}
                    id="username"
                    placeholder="Enter username"
                    {...register("username", {
                      validate: validateUsername,
                    })}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    id="password"
                    placeholder="Enter password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                  <div className="form-text">
                    Password must be at least 8 characters with uppercase, lowercase, and number.
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                    id="confirmPassword"
                    placeholder="Confirm password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                  )}
                </div>
              </>
            )}

            {/* Mode-specific Information */}
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              {createWithEmail ? (
                <span>
                  <strong>Email Mode:</strong> Login credentials will be automatically generated and sent to the provided email address.
                </span>
              ) : (
                <span>
                  <strong>Manual Mode:</strong> You will need to provide the username and password to the user manually.
                </span>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
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
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Create Account
                </>
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </MainContainer>
  );
}
