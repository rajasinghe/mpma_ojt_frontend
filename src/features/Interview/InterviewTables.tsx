import { useState } from 'react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import editIcon from '../../assets/edit.png';
import removeIcon from '../../assets/remove.png';
import Swal from 'sweetalert2';
import api from '../../api';
import './interview.css';
import { getShortEmail } from '../../helpers';

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

export default function InterviewTables({ lastSevenDays, allInterviews, departmentNames }: Props) {
  const [showallInterviews, setShowallInterviews] = useState(false);
  const navigate = useNavigate();

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
            <th>Name/Email</th>
            <th>Interview Date</th>
            <th>Start Date</th>
            <th>Duration</th>
            <th>Departments</th>
            <th>Options</th>
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
                <td style={{ whiteSpace: 'pre-line', minWidth: 180, maxWidth: 240 }}>
                  <div>{interview.name}</div>
                  <div
                    style={{
                      fontSize: '0.9em',
                      color: '#555',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      maxWidth: 220,
                    }}
                  >
                    <span
                      title={interview.email}
                      style={{
                        display: 'inline-block',
                        maxWidth: 140,
                        verticalAlign: 'bottom',
                        fontFamily: 'monospace',
                      }}
                    >
                      {getShortEmail(interview.email, 20)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      style={{ fontSize: '1em', flexShrink: 0 }}
                      onClick={() => navigator.clipboard.writeText(interview.email)}
                      title="Copy email"
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                </td>
                <td>{moment(interview.createdAt).format('YYYY-MM-DD')}</td>
                <td>{moment(interview.date).format('YYYY-MM-DD')}</td>
                <td>{interview.duration || 'Not specified'}</td>
                <td>
                  {interview.departments.map((dept, index) => (
                    <div key={dept.id}>
                      {departmentNames[dept.id] || `Department ${dept.id}`}
                      {dept.fromDate && dept.toDate && (
                        <span className="ms-2 text-muted">
                          ({moment(dept.fromDate).format('MM/DD')} - 
                           {moment(dept.toDate).format('MM/DD')})
                        </span>
                      )}
                      {index < interview.departments.length - 1 && ', '}
                    </div>
                  ))}
                </td>
                <td style={{ verticalAlign: "middle" }}>
                  <div className="d-flex justify-content-center" style={{ height: '100%' }}>
                    <img
                      alt="Edit"
                      className="btn btn-sm btn-outline-secondary"
                      style={{ width: "auto", height: "34px" }}
                      onClick={() => navigate(`${interview.NIC}/edit`)}
                      src={editIcon}
                    />
                    <img
                      alt="Delete"
                      style={{ width: "auto", height: "34px" }}
                      onClick={() => handleDelete(interview.NIC)}
                      className="btn ms-2 btn-sm btn-outline-secondary"
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
          {lastSevenDays.length > 0 ? (
            renderTable(lastSevenDays, 'Last 7 Days Interviews')
          ) : (
            <p className="text-muted">No interviews in the last 7 days</p>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div 
          className="card-header d-flex justify-content-between align-items-center" 
          style={{ cursor: 'pointer' }}
          onClick={() => setShowallInterviews(!showallInterviews)}
        >
          <h5 className="mb-0">All Interviews</h5>
          <i className={`bi bi-chevron-${showallInterviews ? 'up' : 'down'}`}></i>
        </div>
        {showallInterviews && (
          <div className="card-body">
            {allInterviews.length > 0 ? (
              renderTable(allInterviews, 'Last 30 Days Interviews')
            ) : (
              <p className="text-muted">No interviews</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
