import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface DocumentViewerProps {
  show: boolean;
  onHide: () => void;
  documents: any;
  loading: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  show, 
  onHide, 
  documents, 
  loading 
}) => {
  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Documents & Photos</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3">Loading documents...</div>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-file-earmark-text me-2"></i>
          Documents & Photos
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {documents ? (
          <div>
            {/* Profile Photo */}
            {documents.profilePhoto && (
              <div className="mb-4">
                <h6 className="fw-bold text-primary border-bottom pb-2">
                  <i className="bi bi-person-circle me-2"></i>
                  Profile Photo
                </h6>
                <div className="text-center">
                  <img 
                    src={documents.profilePhoto} 
                    alt="Profile" 
                    className="img-thumbnail shadow-sm"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.documents && Object.keys(documents.documents).length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bold text-primary border-bottom pb-2">
                  <i className="bi bi-folder2-open me-2"></i>
                  Documents
                </h6>
                <div className="row g-3">
                  {Object.entries(documents.documents).map(([key, value]) => {
                    if (!value) return null;
                    
                    const documentName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const isImage = (value as string).startsWith('data:image');
                    
                    return (
                      <div key={key} className="col-md-6">
                        <div className="card h-100 shadow-sm">
                          <div className="card-header bg-light">
                            <small className="fw-bold text-dark">
                              <i className={`bi ${isImage ? 'bi-image' : 'bi-file-earmark-pdf'} me-2`}></i>
                              {documentName}
                            </small>
                          </div>
                          <div className="card-body text-center d-flex align-items-center justify-content-center">
                            {isImage ? (
                              <img 
                                src={value as string} 
                                alt={documentName}
                                className="img-thumbnail"
                                style={{ maxWidth: '150px', maxHeight: '150px' }}
                              />
                            ) : (
                              <div>
                                <i className="bi bi-file-earmark-pdf display-4 text-danger mb-3"></i>
                                <div>
                                  <a 
                                    href={value as string} 
                                    download={`${documentName}.pdf`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bi bi-download me-1"></i>
                                    Download PDF
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Documents Message */}
            {(!documents.profilePhoto && (!documents.documents || Object.keys(documents.documents).length === 0)) && (
              <div className="text-center py-5">
                <i className="bi bi-file-earmark-x display-1 text-muted mb-3"></i>
                <h5 className="text-muted">No Documents Available</h5>
                <p className="text-muted">No documents or photos have been uploaded for this trainee.</p>
              </div>
            )}

            {/* Metadata */}
            {documents.metadata && (
              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Available Documents:</strong> {documents.metadata.totalDocuments}
                    </div>
                    <div className="col-md-6">
                      <strong>Retrieved:</strong> {new Date(documents.metadata.retrievedAt).toLocaleString()}
                    </div>
                  </div>
                </small>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
            <h5 className="text-muted">Failed to Load Documents</h5>
            <p className="text-muted">Unable to retrieve documents at this time.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-1"></i>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentViewer;
