import { useEffect, useMemo, useState } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { useLoaderData } from "react-router-dom";
import MiniLoader from "../Components/ui/Loader/MiniLoader";
import moment from "moment";
import api from "../api";
import Swal from "sweetalert2";

// Types
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

export default function PortalAccountsPage() {
  const registeredTrainees = useLoaderData() as RegisteredTrainee[];

  // Pending trainees state
  const [pendingTrainees, setPendingTrainees] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [searchPending, setSearchPending] = useState("");
  const [selectedPendingTrainees, setSelectedPendingTrainees] = useState<string[]>([]);
  const [emailSentTrainees, setEmailSentTrainees] = useState<{ [key: string]: number }>({});

  // Registered trainees search
  const [searchRegistered, setSearchRegistered] = useState("");

  // Effects
  useEffect(() => {
    const fetchPending = async () => {
      setLoadingPending(true);
      try {
        const response = await api.get("api/portal/pending_trainees");
        setPendingTrainees(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (e) {
        console.error("Error fetching pending trainees", e);
        setPendingTrainees([]);
      } finally {
        setLoadingPending(false);
      }
    };
    fetchPending();
  }, []);

  // Helpers
  const isEmailRecentlySent = (email: string) => {
    const sentTime = emailSentTrainees[email];
    if (!sentTime) return false;
    return Date.now() - sentTime < 2 * 60 * 1000; // 2 minutes
  };

  const filteredPendingTrainees = useMemo(() => {
    return pendingTrainees
      .filter(
        (pendingTrainee) => !registeredTrainees.some((r) => r.NIC === pendingTrainee.NIC)
      )
      .filter(
        (t) =>
          t.NIC?.toLowerCase().includes(searchPending.toLowerCase()) ||
          t.name?.toLowerCase().includes(searchPending.toLowerCase()) ||
          t.email?.toLowerCase().includes(searchPending.toLowerCase())
      );
  }, [pendingTrainees, registeredTrainees, searchPending]);

  const filteredRegistered = useMemo(() => {
    if (!searchRegistered) return registeredTrainees;
    return registeredTrainees.filter(
      (t) =>
        t.NIC?.toLowerCase().includes(searchRegistered.toLowerCase()) ||
        t.nickname?.toLowerCase().includes(searchRegistered.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchRegistered.toLowerCase())
    );
  }, [registeredTrainees, searchRegistered]);

  // Actions - Pending
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
        await api.post("api/trainee/sendMails", {
          data: [
            {
              email,
              NIC,
            },
          ],
        });

        setEmailSentTrainees((prev) => ({ ...prev, [email]: Date.now() }));

        Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: `Email successfully sent to ${email}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error sending email:", error);
        Swal.fire({ icon: "error", title: "Failed!", text: `Could not send email to ${email}.` });
      }
    }
  };

  const sendBulkPendingEmails = async () => {
    if (selectedPendingTrainees.length === 0) {
      Swal.fire({ icon: "warning", title: "No Selection", text: "Please select at least one trainee to send emails." });
      return;
    }

    const selectedTraineesData = pendingTrainees
      .filter((t) => selectedPendingTrainees.includes(t.NIC))
      .map((t) => ({ email: t.email, NIC: t.NIC }));

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
        await api.post("api/trainee/sendMails", { data: selectedTraineesData });

        const now = Date.now();
        setEmailSentTrainees((prev) => {
          const updated = { ...prev } as { [key: string]: number };
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
        Swal.fire({ icon: "error", title: "Failed!", text: "Could not send bulk emails." });
      }
    }
  };

  return (
    <MainContainer title="Portal Accounts" breadCrumbs={["Home", "Trainees", "Portal Accounts"]}>
      <SubContainer>
        {/* Pending Trainees Section */}
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-person-check-fill me-2"></i>
              <h5 className="card-title mb-0">Pending Trainees</h5>
            </div>
          </div>
          {loadingPending ? (
            <MiniLoader />
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
                  <div className="mb-3">
                    <button
                      className="btn btn-primary me-2"
                      onClick={sendBulkPendingEmails}
                      disabled={selectedPendingTrainees.length === 0}
                    >
                      Resend Emails ({selectedPendingTrainees.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {filteredPendingTrainees.length === 0 ? (
            <div className="text-black-50 text-center m-3">No pending trainees</div>
          ) : (
            <div className="table-responsive rounded-2 table-scrollbar">
              <table className="table table-sm table-bordered w-100 table-striped align-middle text-center" style={{ fontSize: "0.875rem" }}>
                <thead className="table-dark position-sticky top-0">
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedPendingTrainees.length === filteredPendingTrainees.length && filteredPendingTrainees.length > 0}
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
                          checked={selectedPendingTrainees.includes(trainee.NIC)}
                          onChange={() => handleSelectPendingTrainee(trainee.NIC)}
                        />
                      </td>
                      <td>{trainee.NIC}</td>
                      <td>{trainee.nickname}</td>
                      <td>{trainee.email || "No email"}</td>
                      <td>{moment(trainee.date).format("YYYY-MM-DD")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-1 m-1"
                          onClick={() => sendPendingEmail(trainee.email, trainee.NIC)}
                          disabled={isEmailRecentlySent(trainee.email)}
                          title={
                            isEmailRecentlySent(trainee.email)
                              ? "Email sent recently. Please wait 2 minutes."
                              : "Send email"
                          }
                        >
                          {isEmailRecentlySent(trainee.email) ? "Wait..." : "Resend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Portal Created Trainees Section */}
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex align-items-center">
              <i className="bi bi-people-fill me-2"></i>
              <h5 className="card-title mb-0">Portal Created Trainees</h5>
            </div>
          </div>
          {registeredTrainees.length === 0 ? (
            <div className="text-black-50 text-center m-3">No registered trainees</div>
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
                <table className="table table-sm table-bordered w-100 table-striped align-middle text-center" style={{ fontSize: "0.875rem" }}>
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
                    {filteredRegistered.map((trainee, idx) => (
                      <tr key={idx}>
                        <td>{trainee.NIC}</td>
                        <td>{trainee.nickname}</td>
                        <td>{trainee?.email || "No email"}</td>
                        <td>{moment(trainee.start_date).format("YYYY-MM-DD")}</td>
                        <td>
                          <button className="btn btn-sm btn-success me-1">Register</button>
                          <button className="btn btn-sm btn-info me-1">View</button>
                          <button className="btn btn-sm btn-danger">Delete</button>
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
    </MainContainer>
  );
}
