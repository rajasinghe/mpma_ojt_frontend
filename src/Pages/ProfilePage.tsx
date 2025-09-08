import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { formatDate, getMonthName } from "../helpers";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { getDateDifferenceFormatted } from "../helpers";
import api from "../api";
import { Button, Spinner, Alert } from "react-bootstrap";
import DocumentViewer from "../Components/DocumentViewer";

// TraineeUploads Component
const TraineeUploads = ({ nic }: { nic: string }) => {
  const navigate = useNavigate();
  const [traineeDetails, setTraineeDetails] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trainee details on component mount
  useEffect(() => {
    const fetchTraineeDetails = async () => {
      try {
        console.log("🔍 TraineeUploads: Fetching details for NIC:", nic);
        setLoading(true);
        setError(null);
        const response = await api.get(`api/portal/trainee_details/${nic}`);
        console.log("✅ TraineeUploads: API Response:", response.data);
        setTraineeDetails(response.data);
      } catch (error: any) {
        console.error("❌ TraineeUploads: Error fetching trainee details:", error);
        console.error("❌ TraineeUploads: Error response:", error.response);
        if (error.response?.status === 404) {
          console.log("⚠️ TraineeUploads: 404 - Trainee details not found for NIC:", nic);
          // If trainee details not found, don't show error, just don't render the section
          setTraineeDetails(null);
        } else {
          console.error("❌ TraineeUploads: Non-404 error:", error.response?.status, error.message);
          setError("Failed to load trainee details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (nic) {
      console.log("🚀 TraineeUploads: Component mounted with NIC:", nic);
      fetchTraineeDetails();
    } else {
      console.warn("⚠️ TraineeUploads: No NIC provided to component");
    }
  }, [nic]);

  // Fetch documents when "See More" is clicked
  const handleSeeMore = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.get(`api/portal/document/${nic}`);
      setDocuments(response.data);
      setShowDocuments(true);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Don't render if loading initially
  if (loading) {
    return (
      <div className="container-fluid border border-dark rounded-2 my-2 py-3">
        <div className="d-flex justify-content-center align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading trainee uploads...</span>
        </div>
      </div>
    );
  }

  // Don't render the section if no trainee details found
  if (!traineeDetails) {
    return (
      <div className="container-fluid border border-dark rounded-2 my-2 py-3">
        <div className="fs-5 fw-bolder mb-3">Trainee Uploads</div>
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>No Portal Account Found</strong>
          <p className="mb-2">This trainee doesn't have a portal account yet. Portal accounts are needed to store personal information, emergency contacts, and documents.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/OJT/portal_controls')}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Create Portal Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid border border-dark rounded-2 my-2 py-2">
        <div className="fs-5 fw-bolder mb-3">Trainee Uploads</div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Personal Information */}
        {traineeDetails.personal_info ? (
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-2">Personal Information</h6>
            <div className="row">
              <div className="col-md-6">
                {traineeDetails.personal_info.Name && (
                  <div className="fw-semibold">Name: {traineeDetails.personal_info.Name}</div>
                )}
                {traineeDetails.personal_info.fullName && (
                  <div className="fw-semibold">Full Name: {traineeDetails.personal_info.fullName}</div>
                )}
                {traineeDetails.personal_info.NIC && (
                  <div className="fw-semibold">NIC: {traineeDetails.personal_info.NIC}</div>
                )}
                {traineeDetails.personal_info.email && (
                  <div className="fw-semibold">Email: {traineeDetails.personal_info.email}</div>
                )}
                {traineeDetails.personal_info.Mobile_No && (
                  <div className="fw-semibold">Mobile: {traineeDetails.personal_info.Mobile_No}</div>
                )}
                {traineeDetails.personal_info.Resident_No && (
                  <div className="fw-semibold">Resident: {traineeDetails.personal_info.Resident_No}</div>
                )}
              </div>
              <div className="col-md-6">
                {traineeDetails.personal_info.Training_institute && (
                  <div className="fw-semibold">Training Institute: {traineeDetails.personal_info.Training_institute}</div>
                )}
                {traineeDetails.personal_info.training_period && (
                  <div className="fw-semibold">Training Period: {traineeDetails.personal_info.training_period}</div>
                )}
                {traineeDetails.personal_info.course && (
                  <div className="fw-semibold">Course: {traineeDetails.personal_info.course}</div>
                )}
                {traineeDetails.personal_info.start_date && (
                  <div className="fw-semibold">Start Date: {formatDate(traineeDetails.personal_info.start_date)}</div>
                )}
                {traineeDetails.personal_info.address && (
                  <div className="fw-semibold">Address: {traineeDetails.personal_info.address}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-2">Personal Information</h6>
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No personal information has been added yet.
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {traineeDetails.Emegency_contact ? (
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-2">Emergency Contact</h6>
            <div className="row">
              <div className="col-md-6">
                {traineeDetails.Emegency_contact.name && (
                  <div className="fw-semibold">Name: {traineeDetails.Emegency_contact.name}</div>
                )}
                {traineeDetails.Emegency_contact.relationship && (
                  <div className="fw-semibold">Relationship: {traineeDetails.Emegency_contact.relationship}</div>
                )}
                {traineeDetails.Emegency_contact.telephone && (
                  <div className="fw-semibold">Telephone: {traineeDetails.Emegency_contact.telephone}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-2">Emergency Contact</h6>
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No emergency contact has been added yet.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          <Button
            variant="info"
            size="sm"
            onClick={handleSeeMore}
            disabled={documentsLoading}
          >
            {documentsLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              <>
                <i className="bi bi-eye me-1"></i>
                View Documents
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/OJT/trainee/update-uploads/${nic}`)}
          >
            <i className="bi bi-pencil-square me-1"></i>
            Update Details
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        show={showDocuments}
        onHide={() => setShowDocuments(false)}
        documents={documents}
        loading={documentsLoading}
      />
    </>
  );
};

export default function ProfilePage() {
  const { trainee, departments, /*periods,*/ programs, institutes } =
    useLoaderData() as any;
  useEffect(() => {
    console.log("🔍 ProfilePage: Trainee object:", trainee);
    console.log("🔍 ProfilePage: Trainee NIC_NO:", trainee.NIC_NO);
    console.log("🔍 ProfilePage: All trainee keys:", Object.keys(trainee));
    console.log(institutes);
  }, []);
  return (
    <MainContainer
      title="Trainee Profile"
      breadCrumbs={["Home", "Trainee", "Profile"]}
    >
      <SubContainer>
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="fs-5 fw-bolder">Trainee Details</div>
          <div className="fw-semibold ">
            Status - {trainee.status == 1 ? "Active" : "Inactive"}
          </div>
          <div className="fw-semibold ">Reg NO - {trainee.REG_NO}</div>
          <div className="fw-semibold">ATT NO - {trainee.ATT_NO}</div>
          <div className="fw-semibold">
            Training Program -
            {
              programs.find(
                (program: any) => trainee.training_program_id == program.id
              ).name
            }{" "}
          </div>
          <div className="fw-semibold">
            Institute -{" "}
            {
              institutes.find(
                (institute: any) => trainee.institute_id == institute.id
              ).name
            }{" "}
          </div>
          <div className="  fw-semibold">NIC - {trainee.NIC_NO}</div>
          <div className="  fw-semibold">Name - {trainee.name}</div>
          <div className="  fw-semibold">
            Contact Number - {trainee.contact_no}
          </div>
          {trainee.email ? (
            <div className="  fw-semibold">Email - {trainee.email}</div>
          ) : null}
          <div>
            <Link
              to={`/OJT/Trainees/${trainee.id}/update`}
              className="btn btn-sm btn-warning"
            >
              Update
            </Link>
          </div>
        </div>
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className=" fs-5 fw-bolder">Training Schedule</div>
          <div className=" fw-semibold">
            Training Period -{" "}
            {getDateDifferenceFormatted(trainee.start_date, trainee.end_date)}
            {/*periods.find((period: any) => trainee.training_period_id == period.id).name*/}
          </div>
          <div className=" fw-semibold">
            start date - {formatDate(trainee.start_date)}
          </div>
          <div className=" fw-semibold">
            end date - {formatDate(trainee.end_date)}
          </div>
          {!trainee.schedules && (
            <div className="text-black-50">not assigned to departments yet</div>
          )}
          <div>
            {trainee.schedules && (
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Department</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {trainee.schedules.map((schedule: any, index: any) => (
                    <tr key={index}>
                      <td>
                        {
                          departments.find(
                            (department: any) =>
                              schedule.department_id == department.id
                          ).name
                        }
                      </td>
                      <td>{formatDate(schedule.start_date)}</td>
                      <td>{formatDate(schedule.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="d-flex">
              <Link
                to={`/OJT/trainees/${trainee.id}/add_schedules`}
                className="btn  btn-sm btn-warning"
              >
                Update
              </Link>
            </div>
          </div>
        </div>
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className=" fs-5 fw-bolder">Bank Details</div>
          {trainee.bankDetails ? (
            <>
              <div className="  fw-semibold">
                Name - {trainee.bankDetails.name}
              </div>
              <div className="  fw-semibold">
                Account Number - {trainee.bankDetails.acc_no}
              </div>
              <div className="  fw-semibold">
                Branch Code - {trainee.bankDetails.branch_code}
              </div>
              <div>
                <Link
                  to={`/OJT/trainees/${trainee.id}/bank_details/update`}
                  className="btn  btn-sm btn-warning"
                >
                  update
                </Link>
              </div>
            </>
          ) : (
            <Link
              to={`/OJT/trainees/${trainee.id}/bank_details`}
              className="btn btn-sm btn-primary"
            >
              Add Bank Details
            </Link>
          )}
        </div>
        <div className="container-fluid border border-dark rounded-2 my-2">
          <div className=" fs-5 fw-bolder">Attendence</div>
          <div className="mt-2">
            {!(trainee.attendence.summary.length > 0) ? (
              <div className="text-black-50">
                Attendece Records are not yet uploaded{" "}
              </div>
            ) : (
              trainee.attendence.summary.map((yearRecord: any) => {
                return (
                  <div>
                    <div className=" fw-semibold fs-5">{yearRecord.year}</div>
                    <table className="table table-bordered table-sm w-50">
                      <thead className="table-light">
                        <tr>
                          <th>Month</th>
                          <th>Percentage</th>
                          <th>options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearRecord.months.map((monthRecord: any) => {
                          return (
                            <tr>
                              <td>{getMonthName(monthRecord.month)}</td>
                              <td>
                                {Math.round(
                                  (monthRecord.presentCount /
                                    monthRecord.totalCount) *
                                    100
                                )}
                                %
                              </td>
                              <td>
                                <Link
                                  className="btn btn-sm btn-success"
                                  to={`/OJT/attendence?month=${monthRecord.month}&year=${yearRecord.year}&id=${trainee.id}`}
                                >
                                  View attendence records
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>
          {trainee.attendence.summary.length > 0 && (
            <div>
              <div className=" fw-semibold">
                Total Attendece Percentage -{" "}
                {Math.round(
                  (trainee.attendence.totalPresentCount /
                    trainee.attendence.totalCount) *
                    100
                )}
                %
              </div>
              <div className=" fw-semibold">
                Total Attendece Count - {trainee.attendence.totalPresentCount}{" "}
                days
              </div>
              <div className=" fw-semibold">
                Total Working Days Count - {trainee.attendence.totalCount} days
              </div>
            </div>
          )}
        </div>
        {/* Trainee Uploads Section */}
        <TraineeUploads nic={trainee.NIC_NO} />
      </SubContainer>
    </MainContainer>
  );
}
