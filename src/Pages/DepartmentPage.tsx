import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/Loader/Loader";
import { useEffect, useState } from "react";
import moment from "moment";
import InterviewModal from "../Components/Modals/NewInterviewModal";
import editIcon from "../assets/edit.png";
import removeIcon from "../assets/remove_icon_sm.png";
import Swal from "sweetalert2";
import api from "../api";
export default function DepartmentPage() {
  const { state } = useNavigation();
  const { department } = useLoaderData() as any;
  const [interviews, setInterviews] = useState(department.interviews);
  const [isInterviewsLoading, setInterviewLoading] = useState(false);
  const interviewModalVisibilityState = useState<boolean>(false);
  const [selectedInterview, setSelectedInterview] = useState(undefined);
  const refetchInterviews = async () => {
    //show the mini loader
    try {
      setInterviewLoading(true);
      const response = await api.get(`api/department/${department.id}/interview`);
      console.log(response.data);
      setInterviews(response.data);
      setInterviewLoading(false);
    } catch (error) {
      //console.log(error);
      Swal.fire({
        title: "Error",
        text: "failed to fetch interviews ",
        html: <div>refresh the page</div>,
      });
    }
  };

  const handleDelete = async (id: number) => {
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
        const response = await api.delete(`api/interview/${id}`);
        console.log(response);
        refetchInterviews();
        Swal.fire({
          title: "Deleted!",
          text: "Removed from the List",
          icon: "success",
          showCloseButton: true,
        });
      }
    } catch (error) {}
  };

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div>
          <section className="bg-primary-subtle ">
            <div className="px-3  fw-bold fs-3">{department.name}</div>
          </section>
          <section className=" m-1 border border-dark-subtle border-2 rounded bg-body-tertiary p-2">
            <div className="container-fluid border border-dark rounded-2 my-2 py-2">
              <div className="fw-semibold ">Active Trainees - {department.schedules.length}</div>
              <div className="fw-semibold ">Maximum Capacity - {department.max_count}</div>
              <div className="fw-semibold ">Interviewed - {department.interviews.length}</div>
            </div>
            <div className="container-fluid border border-dark rounded-2 my-2 py-2">
              <div className=" fs-5 fw-bolder">Active Trainees</div>

              <div className="w-75 border border-2 rounded-2 p-1 ">
                <div>
                  <table className="table table-striped table-sm table-bordered w-100">
                    <thead className="table-dark">
                      <tr className="small" style={{ fontSize: "" }}>
                        <th></th>
                        <th>name</th>
                        <th>Att NO</th>
                        <th>Reg NO</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department.schedules.map((schedule: any, index: number) => (
                        <tr key={`${schedule.id}`}>
                          <td>{index + 1}</td>
                          <td>{schedule.trainee.name}</td>
                          <td>{schedule.trainee.ATT_NO}</td>
                          <td>{schedule.trainee.REG_NO}</td>
                          <td>{schedule.start_date}</td>
                          <td className=" d-flex ">{schedule.end_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="container-fluid border border-dark rounded-2 my-2 py-2">
              <div className=" fs-5 fw-bolder">Interviewed List</div>
              {isInterviewsLoading ? (
                "Loading"
              ) : interviews.length == 0 ? (
                <div className="text-black-50">No pending Interviews</div>
              ) : (
                <div className="w-75 border border-2 rounded-2 p-1 mt-2">
                  <div>
                    <table className="table table-striped table-sm table-bordered ">
                      <thead className="table-dark">
                        <tr className="small" style={{ fontSize: "" }}>
                          <th></th>
                          <th>name</th>
                          <th>NIC</th>
                          <th>Interviewed Date</th>
                          <th>Interviewed Time</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {interviews.map((interview: any, index: number) => {
                          const createdAt = moment(interview.createdAt);
                          return (
                            <tr key={`${interview.id}`}>
                              <td>{index + 1}</td>
                              <td>{interview.name}</td>
                              <td>{interview.NIC}</td>
                              <td>{createdAt.format("YYYY-MM-DD")}</td>
                              <td>{createdAt.format("hh:mm:ss A")}</td>
                              <td>
                                <img
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => {
                                    setSelectedInterview(interview);
                                    interviewModalVisibilityState[1](true);
                                  }}
                                  src={editIcon}
                                />
                                <img
                                  onClick={() => {
                                    handleDelete(interview.id);
                                  }}
                                  className="btn ms-2 btn-sm btn-outline-secondary"
                                  src={removeIcon}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="d-flex">
                <button
                  onClick={() => {
                    setSelectedInterview(undefined);
                    interviewModalVisibilityState[1](true);
                  }}
                  className="btn ms-auto btn-primary btn-sm mt-2"
                >
                  New Interview
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <InterviewModal
        refetchInterviews={refetchInterviews}
        interview={selectedInterview}
        department={department}
        showState={interviewModalVisibilityState}
      />
    </>
  );
}