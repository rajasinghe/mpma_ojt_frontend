import { useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { formatDate, getMonthName } from "../helpers";

export default function ProfilePage() {
  const { trainee, departments, periods, programs, institutes } = useLoaderData() as any;
  useEffect(() => {
    console.log(institutes);
  }, []);
  return (
    <div>
      <section className="bg-primary-subtle ">
        <div className="px-3 fw-bold fs-3">Trainee Profile</div>
      </section>
      <section className=" m-1 border border-dark-subtle border-2 rounded bg-body-tertiary px-2">
        {/* <div>
          <div className=" text-black-50">
            Add the department if the desired department is not in the list
          </div>
          <button
            onClick={() => {
              setDepartmentsModalVisibility(true);
            }}
            className="mt-1 link d-inline badge btn text-dark btn-outline-primary border-3 btn-sm"
          >
            Add Department
          </button>
        </div> */}
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className="fs-5 fw-bolder">Trainee Details</div>
          <div className="fw-semibold ">Reg NO - {trainee.REG_NO}</div>
          <div className="fw-semibold">ATT NO - {trainee.ATT_NO}</div>
          <div className="fw-semibold">
            Training Program -
            {programs.find((program: any) => trainee.training_program_id == program.id).name}{" "}
          </div>
          <div className="fw-semibold">
            Institute -{" "}
            {institutes.find((institute: any) => trainee.institute_id == institute.id).name}{" "}
          </div>
          <div className="  fw-semibold">NIC - 200218103171</div>
          <div className="  fw-semibold">Name - 1090901920</div>
          <div className="  fw-semibold">Contact Number - 07878878676</div>
          <div>
            <Link to={`/OJT/Trainees/${trainee.id}/update`} className="btn btn-sm btn-warning">
              Update
            </Link>
          </div>
        </div>
        <div className="container-fluid border border-dark rounded-2 my-2 py-2">
          <div className=" fs-5 fw-bolder">Training Schedule</div>
          <div className=" fw-semibold">
            Training Period -{" "}
            {periods.find((period: any) => trainee.training_period_id == period.id).name}
          </div>
          <div className=" fw-semibold">start date - {formatDate(trainee.start_date)}</div>
          <div className=" fw-semibold">end date - {formatDate(trainee.end_date)}</div>
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
                            (department: any) => schedule.department_id == department.id
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
              <div className="  fw-semibold">Account Number - {trainee.bankDetails.acc_no}</div>
              <div className="  fw-semibold">Branch Code - {trainee.bankDetails.branch_code}</div>
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
              <div className="text-black-50">Attendece Records are not yet uploaded </div>
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
                                  (monthRecord.presentCount / monthRecord.totalCount) * 100
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
                  (trainee.attendence.totalPresentCount / trainee.attendence.totalCount) * 100
                )}
                %
              </div>
              <div className=" fw-semibold">
                Total Attendece Count - {trainee.attendence.totalPresentCount} days
              </div>
              <div className=" fw-semibold">
                Total Working Days Count - {trainee.attendence.totalCount} days
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
