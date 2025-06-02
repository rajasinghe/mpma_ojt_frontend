import { useNavigation, useNavigate, useLoaderData } from "react-router-dom";
import { useState, useEffect } from "react";
import { utils, writeFileXLSX } from "xlsx";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import { formatDate } from "../../helpers";
import Loader from "../../Components/ui/Loader/Loader";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";
import api from "../../api";
import editIcon from "../../assets/edit.png";
import removeIcon from "../../assets/remove.png";
import Swal from "sweetalert2";
import moment from 'moment';

interface Interview {
  id: number;
  NIC: string;
  name: string;
  date: string;
  duration: string;
  createdAt: string | Date;
  departments: {
    id: number;
    fromDate: string;
    toDate: string;
  }[];
}

interface DepartmentSummary {
  name: string;
  dep_id: number;
  max_count: number;
  active_count: number;
  interview_count: number;
}

export default function ViewInterviewPage() {
  const [matchingInterviews, setMatchingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resultCount, setResultCount] = useState<number>(0);
  const [showPastInterviews, setShowPastInterviews] = useState<boolean>(false);
  const [departmentNames, setDepartmentNames] = useState<{[key: number]: string}>({});
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const { state } = useNavigation();
  const navigate = useNavigate();
  const InterviewDetails = useLoaderData() as any;


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
          const response = await api.delete(`api/interview/${nic}`);
          console.log(response);

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

const fetchDepartmentNames = async () => {
  try {
    const response = await api.get("api/department/summary");
    const departments: DepartmentSummary[] = response.data;
    
    const deptMap = departments.reduce((acc: {[key: number]: string}, dept) => {
      // Use dep_id instead of id, and name instead of dname
      acc[dept.dep_id] = dept.name;
      return acc;
    }, {});
    
    setDepartmentNames(deptMap);
  } catch (error) {
    console.error("Error fetching department names:", error);
    // Optionally show an error message to the user
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load department information'
    });
  } finally {
    setLoadingDepartments(false);
  }
};


    useEffect(() => {
      fetchDepartmentNames();
    }, []);
    
    const getDepartmentName = (departmentId: number) => {
      return departmentNames[departmentId] || "Unknown Department";
    };

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      try {
        const interviews  = InterviewDetails;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const filtered = interviews.filter((interview: Interview) => {
          if (!showPastInterviews) {
            const interviewDate = new Date(interview.date);
            interviewDate.setHours(0, 0, 0, 0);
            return interviewDate >= currentDate;
          }
          return true;
        });

        setMatchingInterviews(filtered);
        setResultCount(filtered.length);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showPastInterviews]);

  const handleDownload = () => {
    const headers = ["NIC", "Name", "Starting Date", "Duration", "Departments"];
    const dataRows = matchingInterviews.map(interview => ({
      NIC: interview.NIC,
      Name: interview.name,
      "Starting Date": formatDate(interview.date),
      "Duration": interview.duration,
      "Departments": interview.departments
      .map(dept => `${getDepartmentName(dept.id)} (${formatDate(dept.fromDate)} - ${formatDate(dept.toDate)})`)
      .join(", "),
      "From": interview.departments.map(dept => formatDate(dept.fromDate)).join(", "),
      "To": interview.departments.map(dept => formatDate(dept.toDate)).join(", "),
    }));

    const worksheet = utils.json_to_sheet(dataRows, { header: headers });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Interviews");
    writeFileXLSX(workbook, "Interviews.xlsx");
  };

  return (
    <>
      {state === "loading" || loading ? (
        <Loader />
      ) : (
        <MainContainer title="Interviews" breadCrumbs={["Home", "Interviews"]}>
          <SubContainer>
            <div className="body">
              <section className="px-2 mt-1">
                <div className="d-flex flex-column">
                  <div className="bg-body-secondary p-2 mb-2 rounded-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="form-check ms-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showPastInterviews"
                          checked={showPastInterviews}
                          onChange={(e) => setShowPastInterviews(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="showPastInterviews">
                          Show All Interviews (Including Past)
                        </label>
                      </div>
                      <div className="ms-auto fw-semibold" style={{ fontSize: "12px" }}>
                        <div>Total Count: {resultCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-2 rounded-2 p-1">
                    <div className="table-responsive rounded-2 table-scrollbar">
                      {loading ? (
                        <MiniLoader />
                      ) : (
                        <table className="table table-sm table-bordered w-100">
                          <thead className="table-dark position-sticky top-0">
                            <tr className="small">
                              <th>NIC</th>
                              <th>Name</th>
                              <th>Starting Date</th>
                              <th>Duration</th>
                              <th>Interviewed Date</th>
                              <th>Interviewed Time</th>
                              <th>Departments</th>
                              <th>Options</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchingInterviews.map((interview) => (
                              <tr key={`${interview.id}`}>
                                <td>{interview.NIC}</td>
                                <td>{interview.name}</td>
                                <td>{formatDate(interview.date)}</td>
                                <td>{interview.duration}</td>
                                <td>{moment(interview.createdAt).format("YYYY-MM-DD")}</td>
                                <td>{moment(interview.createdAt).format("hh:mm:ss A")}</td>
                                <td>
                                {loadingDepartments ? (
                                <MiniLoader />
                                ) : (
                                  interview.departments.map((dep) => (
                                    <div key={dep.id}>
                                      {getDepartmentName(dep.id)} 
                                      {(dep.fromDate && dep.toDate !== '') && (
                                        <span>
                                          ({formatDate(dep.fromDate)} - {formatDate(dep.toDate)})
                                        </span>
                                      )}
                                    </div>
                                  ))
                                )}
                                </td>
                                <td style={{ verticalAlign: "middle" }}>
                                  <div className="d-flex justify-content-center" style={{ height: '100%' }}>
                                    <img
                                      alt="Edit"
                                      className="btn btn-sm btn-outline-secondary"
                                      style={{ width: "auto", height: "34px" }}
                                      onClick={() => {
                                        navigate(`${interview.NIC}/edit`);
                                      }}
                                      src={editIcon}
                                    />
                                    <img
                                      alt="Delete"
                                      style={{ width: "auto", height: "34px" }}
                                      onClick={() => {
                                      handleDelete(interview.NIC);
                                      }}
                                      className="btn ms-2 btn-sm btn-outline-secondary"
                                      src={removeIcon}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="d-flex mt-2">
                    <button
                      className="btn btn-success btn-sm ms-auto"
                      onClick={handleDownload}
                    >
                      Download Records
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}