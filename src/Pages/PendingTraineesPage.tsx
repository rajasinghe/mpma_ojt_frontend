import { useEffect, useState } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import MiniLoader from "../Components/ui/Loader/MiniLoader";
import api from "../api";
import moment from 'moment';
import Swal from "sweetalert2";

const interviewedTrainees = async () => {
  try{
    const response = await api.get("api/interview");
    return response.data.InterviewDetails;
  }
  catch (error) {
    console.error("Error fetching interviewed trainees:", error);
    return [];
  }
}

const registeredTrainees = [
  // Example data, replace with real data from your state or props
  { nic: "456789123V", name: "Alice Brown", email: "alice@example.com", startDate: "2025-07-03" },
  { nic: "654321987V", name: "Bob White", email: "bob@example.com", startDate: "2025-07-04" },
];

export default function PendingTraineesPage() {
  const [searchInterviewed, setSearchInterviewed] = useState("");
  const [searchRegistered, setSearchRegistered] = useState("");
  const [interviewedTraineesData, setInterviewedTraineesData] = useState<any[]>([]);
  const [loadingInterviewed, setLoadingInterviewed] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(false);
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [emailSentTrainees, setEmailSentTrainees] = useState<{[key: string]: number}>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    message: ''
  });

  useEffect(() => {
    setLoadingInterviewed(true);
    interviewedTrainees().then(result => {
      if (!Array.isArray(result)) {
        setInterviewedTraineesData([]);
      } else if (Array.isArray(result)) {
        setInterviewedTraineesData(result);
      }
      setLoadingInterviewed(false);
    });
  }, []);

  // Check if email was sent within last 2 minutes
  const isEmailRecentlySent = (email: string) => {
    const sentTime = emailSentTrainees[email];
    if (!sentTime) return false;
    return (Date.now() - sentTime) < 2 * 60 * 1000; // 2 minutes
  };

  const sendMail = async (mail: any) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `Send login details to ${mail}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send it',
      cancelButtonText: 'Cancel',
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.post("api/trainee/sendMails", {
          email: [mail],
        });

        // Mark email as sent with timestamp
        setEmailSentTrainees(prev => ({
          ...prev,
          [mail]: Date.now()
        }));

        // Move trainee to bottom of list
        setInterviewedTraineesData(prev => {
          const traineeIndex = prev.findIndex(t => t.email === mail);
          if (traineeIndex !== -1) {
            const trainee = prev[traineeIndex];
            const newList = [...prev];
            newList.splice(traineeIndex, 1);
            newList.push(trainee);
            return newList;
          }
          return prev;
        });

        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: `Email successfully sent to ${mail}`,
          timer: 2000,
          showConfirmButton: false,
        });

      } catch (error) {
        console.error("Error sending email:", error);

        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: `Could not send email to ${mail}.`,
        });
      }
    }
  };

  const sendBulkMails = async () => {
    if (selectedTrainees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one trainee to send emails.',
      });
      return;
    }

    const selectedEmails = interviewedTraineesData
      .filter(t => selectedTrainees.includes(t.NIC))
      .map(t => t.email);

    const confirm = await Swal.fire({
      title: 'Send Bulk Emails?',
      text: `Send login details to ${selectedEmails.length} trainees?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send all',
      cancelButtonText: 'Cancel',
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.post("api/trainee/sendMails", {
          email: selectedEmails,
        });

        // Mark all emails as sent with timestamp
        const now = Date.now();
        setEmailSentTrainees(prev => {
          const updated = { ...prev };
          selectedEmails.forEach(email => {
            updated[email] = now;
          });
          return updated;
        });

        // Move selected trainees to bottom of list
        setInterviewedTraineesData(prev => {
          const selected = prev.filter(t => selectedTrainees.includes(t.NIC));
          const remaining = prev.filter(t => !selectedTrainees.includes(t.NIC));
          return [...remaining, ...selected];
        });

        setSelectedTrainees([]);

        Swal.fire({
          icon: 'success',
          title: 'Bulk Emails Sent!',
          text: `Emails successfully sent to ${selectedEmails.length} trainees`,
          timer: 2000,
          showConfirmButton: false,
        });

      } catch (error) {
        console.error("Error sending bulk emails:", error);

        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: 'Could not send bulk emails.',
        });
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTrainees(filteredInterviewed.map(t => t.NIC));
    } else {
      setSelectedTrainees([]);
    }
  };

  const handleSelectTrainee = (nic: string) => {
    setSelectedTrainees(prev =>
      prev.includes(nic)
        ? prev.filter(id => id !== nic)
        : [...prev, nic]
    );
  };

  const handleScheduleEmail = async () => {
    if (selectedTrainees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one trainee to schedule emails.',
      });
      return;
    }

    if (!scheduleData.date || !scheduleData.time) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please provide both date and time for scheduling.',
      });
      return;
    }

    const selectedEmails = interviewedTraineesData
      .filter(t => selectedTrainees.includes(t.NIC))
      .map(t => t.email);

    try {
      const response = await api.post("api/trainee/schedule/sendMail", {
        emails: selectedEmails,
        scheduleDate: scheduleData.date,
        scheduleTime: scheduleData.time,
        message: scheduleData.message
      });

      Swal.fire({
        icon: 'success',
        title: 'Email Scheduled!',
        text: `Emails scheduled for ${selectedEmails.length} trainees on ${scheduleData.date} at ${scheduleData.time}`,
        timer: 2000,
        showConfirmButton: false,
      });

      setShowScheduleModal(false);
      setSelectedTrainees([]);
      setScheduleData({ date: '', time: '', message: '' });

    } catch (error) {
      console.error("Error scheduling emails:", error);

      Swal.fire({
        icon: 'error',
        title: 'Failed!',
        text: 'Could not schedule emails.',
      });
    }
  };

  const handleViewTrainee = async (nic: string) => {
    try {
      const response = await api.get(`api/trainee/profile/${nic}`);
      
      // You can customize this to show profile data in a modal or navigate to profile page
      Swal.fire({
        title: 'Trainee Profile',
        html: `
          <div style="text-align: left;">
            <p><strong>NIC:</strong> ${response.data.NIC || nic}</p>
            <p><strong>Name:</strong> ${response.data.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${response.data.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${response.data.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${response.data.address || 'N/A'}</p>
          </div>
        `,
        width: '600px',
        confirmButtonText: 'Close'
      });

    } catch (error) {
      console.error("Error fetching trainee profile:", error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not fetch trainee profile.',
      });
    }
  };

  const handleDeleteTrainee = async (nic: string, name: string) => {
    const confirm = await Swal.fire({
      title: 'Delete Trainee?',
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    });

    if (confirm.isConfirmed) {
      try {
        const response = await api.delete(`api/trainee/delete/${nic}`);

        setInterviewedTraineesData(prev => 
          prev.filter(t => t.NIC !== nic)
        );

        setSelectedTrainees(prev => 
          prev.filter(id => id !== nic)
        );

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `${name} has been deleted successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });

      } catch (error) {
        console.error("Error deleting trainee:", error);

        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: 'Could not delete trainee.',
        });
      }
    }
  };

  // Filtered data
  const filteredInterviewed = interviewedTraineesData.filter(t =>
    t.NIC.toLowerCase().includes(searchInterviewed.toLowerCase()) ||
    t.name?.toLowerCase().includes(searchInterviewed.toLowerCase()) ||
    t.email.toLowerCase().includes(searchInterviewed.toLowerCase())
  );
  const filteredRegistered = registeredTrainees.filter(t =>
    t.nic.toLowerCase().includes(searchRegistered.toLowerCase()) ||
    t.name.toLowerCase().includes(searchRegistered.toLowerCase()) ||
    t.email.toLowerCase().includes(searchRegistered.toLowerCase())
  );

  return (
    <MainContainer title="Pending Trainees" breadCrumbs={["Home", "Pending Trainees"]}>
      <SubContainer>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Interviewed Trainees</h4>
          <div>
            {selectedTrainees.length > 0 && (
              <>
                <button 
                  className="btn btn-primary me-2"
                  onClick={sendBulkMails}
                >
                  Send Bulk Emails ({selectedTrainees.length})
                </button>
                <button 
                  className="btn btn-warning me-2"
                  onClick={() => setShowScheduleModal(true)}
                >
                  Schedule Emails
                </button>
              </>
            )}
          </div>
        </div>

        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search interviewed trainees..."
          value={searchInterviewed}
          onChange={e => setSearchInterviewed(e.target.value)}
          style={{ maxWidth: 300 }}
        />

        <div className="table-responsive mb-5">
          {loadingInterviewed ? (
            <MiniLoader />
          ) : (
            <table className="table table-bordered table-striped align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedTrainees.length === filteredInterviewed.length && filteredInterviewed.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>NIC</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviewed.map((trainee, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTrainees.includes(trainee.NIC)}
                        onChange={() => handleSelectTrainee(trainee.NIC)}
                      />
                    </td>
                    <td>{trainee.NIC}</td>
                    <td>{trainee.name}</td>
                    <td>{trainee.email}</td>
                    <td>{moment(trainee.date).format('YYYY-MM-DD')}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary me-1"
                        onClick={() => sendMail(trainee.email)}
                        disabled={isEmailRecentlySent(trainee.email)}
                        title={isEmailRecentlySent(trainee.email) ? 'Email sent recently. Please wait 2 minutes.' : 'Send/Resend email'}
                      >
                        {isEmailRecentlySent(trainee.email) ? 'Wait...' : 'Send/Resend'}
                      </button>
                      <button 
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleViewTrainee(trainee.NIC)}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTrainee(trainee.NIC, trainee.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Schedule Email Modal */}
        {showScheduleModal && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Schedule Email</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowScheduleModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Selected Trainees: {selectedTrainees.length}</label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={scheduleData.date}
                      onChange={e => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={scheduleData.time}
                      onChange={e => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message (Optional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={scheduleData.message}
                      onChange={e => setScheduleData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Additional message for the scheduled email..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleScheduleEmail}
                  >
                    Schedule Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <h4>Registered Trainees</h4>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search registered trainees..."
          value={searchRegistered}
          onChange={e => setSearchRegistered(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <div className="table-responsive">
          {loadingRegistered ? (
            <MiniLoader />
          ) : (
            <table className="table table-bordered table-striped align-middle text-center">
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
                {filteredRegistered.map((trainee, idx) => (
                  <tr key={idx}>
                    <td>{trainee.nic}</td>
                    <td>{trainee.name}</td>
                    <td>{trainee.email}</td>
                    <td>{trainee.startDate}</td>
                    <td>
                      <button className="btn btn-sm btn-success me-1">Add Schedule</button>
                      <button className="btn btn-sm btn-info me-1">View</button>
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SubContainer>
    </MainContainer>
  );
}