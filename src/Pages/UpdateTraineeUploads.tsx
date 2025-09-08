import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainContainer } from '../layout/containers/main_container/MainContainer';
import SubContainer from '../layout/containers/sub_container/SubContainer';
import { Button, Form, Row, Col, Alert, Spinner, Card } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import Swal from 'sweetalert2';
import DocumentViewer from '../Components/DocumentViewer';

// Validation schema
const updateDetailsSchema = z.object({
  personalInfo: z.object({
    Name: z.string().optional(),
    fullName: z.string().optional(),
    Training_institute: z.string().optional(),
    training_period: z.string().optional(),
    start_date: z.string().optional(),
    course: z.string().optional(),
    address: z.string().optional(),
    Mobile_No: z.string().optional(),
    Resident_No: z.string().optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    telephone: z.string().optional(),
  }).optional(),
});

type UpdateDetailsFormData = z.infer<typeof updateDetailsSchema>;

const UpdateTraineeUploads: React.FC = () => {
  const { nic } = useParams<{ nic: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traineeDetails, setTraineeDetails] = useState<any>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<UpdateDetailsFormData>({
    resolver: zodResolver(updateDetailsSchema),
    mode: 'onBlur'
  });

  // Fetch trainee details on component mount
  useEffect(() => {
    const fetchTraineeDetails = async () => {
      if (!nic) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`api/portal/trainee_details/${nic}`);
        setTraineeDetails(response.data);
        
        // Pre-populate form with existing data
        if (response.data.personal_info) {
          const personalInfo = response.data.personal_info;
          Object.keys(personalInfo).forEach(key => {
            if (personalInfo[key] && key !== 'id' && key !== 'user_id' && key !== 'createdAt' && key !== 'updatedAt') {
              setValue(`personalInfo.${key}` as any, personalInfo[key]);
            }
          });
        }
        
        if (response.data.Emegency_contact) {
          const emergencyContact = response.data.Emegency_contact;
          Object.keys(emergencyContact).forEach(key => {
            if (emergencyContact[key] && key !== 'id' && key !== 'user_id' && key !== 'createdAt' && key !== 'updatedAt') {
              setValue(`emergencyContact.${key}` as any, emergencyContact[key]);
            }
          });
        }
        
      } catch (error: any) {
        console.error('Error fetching trainee details:', error);
        if (error.response?.status === 404) {
          setError('Trainee not found with the provided NIC');
        } else {
          setError('Failed to load trainee details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTraineeDetails();
  }, [nic, setValue]);

  // Handle form submission
  const onSubmit = async (data: UpdateDetailsFormData) => {
    if (!nic) return;
    
    try {
      setSubmitting(true);
      
      // Filter out empty strings and undefined values
      const cleanData = {
        personalInfo: data.personalInfo ? Object.fromEntries(
          Object.entries(data.personalInfo).filter(([_, value]) => value !== '' && value !== undefined)
        ) : undefined,
        emergencyContact: data.emergencyContact ? Object.fromEntries(
          Object.entries(data.emergencyContact).filter(([_, value]) => value !== '' && value !== undefined)
        ) : undefined,
      };

      // Remove empty objects
      if (cleanData.personalInfo && Object.keys(cleanData.personalInfo).length === 0) {
        cleanData.personalInfo = undefined;
      }
      if (cleanData.emergencyContact && Object.keys(cleanData.emergencyContact).length === 0) {
        cleanData.emergencyContact = undefined;
      }

      const response = await api.put(`api/portal/update_detIals/${nic}`, cleanData);
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: response.data.message,
        confirmButtonText: 'OK'
      });
      
      // Navigate back to profile page
      navigate(-1);
      
    } catch (error: any) {
      console.error('Error updating details:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update details',
        confirmButtonText: 'OK'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view documents
  const handleViewDocuments = async () => {
    if (!nic) return;
    
    try {
      setDocumentsLoading(true);
      const response = await api.get(`api/portal/document/${nic}`);
      setDocuments(response.data);
      setShowDocuments(true);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to load documents',
        confirmButtonText: 'OK'
      });
    } finally {
      setDocumentsLoading(false);
    }
  };

  if (loading) {
    return (
      <MainContainer
        title="Update Trainee Uploads"
        breadCrumbs={['Home', 'Trainee', 'Profile', 'Update Uploads']}
      >
        <SubContainer>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <div className="mt-3">Loading trainee details...</div>
            </div>
          </div>
        </SubContainer>
      </MainContainer>
    );
  }

  if (error) {
    return (
      <MainContainer
        title="Update Trainee Uploads"
        breadCrumbs={['Home', 'Trainee', 'Profile', 'Update Uploads']}
      >
        <SubContainer>
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Alert>
        </SubContainer>
      </MainContainer>
    );
  }

  return (
    <>
      <MainContainer
        title="Update Trainee Uploads"
        breadCrumbs={['Home', 'Trainee', 'Profile', 'Update Uploads']}
      >
        <SubContainer>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1">Update Trainee Details</h4>
              <p className="text-muted mb-0">NIC: {nic}</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="info" 
                onClick={handleViewDocuments}
                disabled={documentsLoading}
              >
                {documentsLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-eye me-2"></i>
                    View Documents
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>
                Back to Profile
              </Button>
            </div>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)}>
            {/* Personal Information Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-person-fill me-2"></i>
                  Personal Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.Name')}
                        isInvalid={!!errors.personalInfo?.Name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.Name?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.fullName')}
                        isInvalid={!!errors.personalInfo?.fullName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.fullName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        {...register('personalInfo.email')}
                        isInvalid={!!errors.personalInfo?.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.email?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.Mobile_No')}
                        isInvalid={!!errors.personalInfo?.Mobile_No}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.Mobile_No?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Resident Number</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.Resident_No')}
                        isInvalid={!!errors.personalInfo?.Resident_No}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.Resident_No?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Training Institute</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.Training_institute')}
                        isInvalid={!!errors.personalInfo?.Training_institute}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.Training_institute?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Training Period</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.training_period')}
                        isInvalid={!!errors.personalInfo?.training_period}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.training_period?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        {...register('personalInfo.start_date')}
                        isInvalid={!!errors.personalInfo?.start_date}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.start_date?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('personalInfo.course')}
                        isInvalid={!!errors.personalInfo?.course}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.course?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        {...register('personalInfo.address')}
                        isInvalid={!!errors.personalInfo?.address}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.personalInfo?.address?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Emergency Contact Section */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Emergency Contact
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Name</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('emergencyContact.name')}
                        isInvalid={!!errors.emergencyContact?.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.emergencyContact?.name?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Relationship</Form.Label>
                      <Form.Select
                        {...register('emergencyContact.relationship')}
                        isInvalid={!!errors.emergencyContact?.relationship}
                      >
                        <option value="">Select Relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.emergencyContact?.relationship?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telephone</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('emergencyContact.telephone')}
                        isInvalid={!!errors.emergencyContact?.telephone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.emergencyContact?.telephone?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-3 mb-4">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Update Details
                  </>
                )}
              </Button>
            </div>
          </Form>
        </SubContainer>
      </MainContainer>

      {/* Document Viewer Modal */}
      <DocumentViewer
        show={showDocuments}
        onHide={() => setShowDocuments(false)}
        documents={documents}
        loading={documentsLoading}
      />
    </>
  );
};

export default UpdateTraineeUploads;
