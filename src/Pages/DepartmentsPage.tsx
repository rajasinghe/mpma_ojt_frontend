import { Link, useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { useEffect } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { utils, writeFileXLSX } from "xlsx";

interface DepartmentSummary {
  dep_id: number;
  name: string;
  active_count: number;
  interview_count: number;
  max_count: number;
}

export default function DepartmentsPage() {
  const { state } = useNavigation();
  const loaderData = useLoaderData() as any;
  useEffect(() => {
    console.log(loaderData);
  }, []);

  const totals = loaderData.reduce((acc: { max_count: number; active_count: number; interview_count: number }, curr: DepartmentSummary) => {
    acc.max_count += curr.max_count;
    acc.active_count += curr.active_count;
    acc.interview_count += curr.interview_count;
    return acc;
  }, { max_count: 0, active_count: 0, interview_count: 0 });

  const handleDownload = async () => {
    try {
      const headers = [
        "Department",
        "Active Count",
        "Interviews",
        "Max count",
      ];
      const dataRows = loaderData.map((dep: any) => {
        return [
          dep.name,
          dep.active_count,
          dep.interview_count,
          dep.max_count,
        ];
      });

      const rows = [headers, ...dataRows];
      const book = utils.book_new();

      const sheet = utils.aoa_to_sheet(rows);
      utils.book_append_sheet(book, sheet, "Register");
      writeFileXLSX(book, "departmentSummary.xlsx", { bookType: "xlsx" });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer title="Departments" breadCrumbs={["Home", "Departments"]}>
          <SubContainer>
            <div className="container-fluid border border-dark rounded-2 my-2 py-2" style={{maxWidth: "1200px"}}>
              <div className="fw-semibold ">Total Active Trainees - {totals.active_count}</div>
              <div className="fw-semibold ">Total Maximum Capacity - {totals.max_count}</div>
              <div className="fw-semibold ">Total Interviewed - {totals.interview_count}</div>
            </div>
            <div>
            <section
              style={{ maxWidth: "1200px"}}
              className="border border-2 rounded-2 p-1 m-2 overflow-y-auto mx-auto"
            >
              <table className="table table-striped table-sm table-bordered w-100">
                <thead className="table-dark position-sticky top-0">
                  <tr className="small" style={{ fontSize: "" }}>
                    <th></th>
                    <th>Department</th>
                    <th>Active Count</th>
                    <th>Interviews</th>
                    <th>max count</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {loaderData.map((department: any, index: number) => (
                    <tr key={`${department.dep_id}`}>
                      <td>{index + 1}</td>
                      <td>{department.name}</td>
                      <td>{department.active_count}</td>
                      <td>{department.interview_count}</td>
                      <td>{department.max_count}</td>
                      <td className=" d-flex ">
                        <Link
                          to={`/OJT/departments/${department.dep_id}`}
                          className="btn btn-primary btn-sm mx-auto "
                        >
                          view Trainees List
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            </div>
            <div
              className="d-flex m-1 mx-auto justify-content-end"
              style={{
              height: "4vh", maxWidth: "1200px",
              }}
              >
            <button className="btn btn-success btn-sm" onClick={handleDownload}>
              Download Records
            </button>
            </div>            
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
