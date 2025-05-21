import { Link, useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { useEffect } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

export default function DepartmentsPage() {
  const { state } = useNavigation();
  const loaderData = useLoaderData() as any;
  useEffect(() => {
    console.log(loaderData);
  }, []);
  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer title="Departments" breadCrumbs={["Home", "Departments"]}>
          <SubContainer>
            <div>
            <section
              style={{ maxHeight: "75vh", maxWidth: "1200px"}}
              className="border border-2 rounded-2 p-1 m-2 overflow-y-auto mx-auto"
            >
              <table className="table table-striped table-sm table-bordered w-100">
                <thead className="table-dark position-sticky top-0">
                  <tr className="small" style={{ fontSize: "" }}>
                    <th>Department</th>
                    <th>Active Count</th>
                    <th>Pending Interviews</th>
                    <th>max count</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {loaderData.map((department: any) => (
                    <tr key={`${department.dep_id}`}>
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
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
