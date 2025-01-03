import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../../Components/Loader/Loader";
import { Fragment, useEffect, useState } from "react";
import editIcon from "../../assets/edit.png";
import activeIcon from "../../assets/active.png";
import inactiveIcon from "../../assets/inactive.png";
import Swal from "sweetalert2";
import api from "../../api";
import MiniLoader from "../../Components/Loader/MiniLoader";
export default function ViewUsersPage() {
  const { state } = useNavigation();
  const loaderData = useLoaderData() as any;
  const [isLoading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState(loaderData);

  useEffect(() => {
    console.log(loaderData);
  }, []);

  const activateUser = async (userId: number) => {
    console.log("activate");

    try {
      const { isConfirmed } = await Swal.fire({
        title: "Activate User Account",
        text: "confirm account activation",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Activate",
      });
      if (isConfirmed) {
        Swal.fire({
          title: "Please Wait... ",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await api.put(`auth/user/${userId}/activate`);
        revalidateData();
        Swal.close();
        Swal.fire({
          title: "User Updated",
          text: "User has been Activated",
          icon: "success",
          showCloseButton: true,
        });
      }
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  const deactivateUser = async (userId: number) => {
    console.log("suspend");
    try {
      const { isConfirmed } = await Swal.fire({
        title: "Deactivate User Account",
        text: "Confirm account deactivation",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Deactivate",
      });
      if (isConfirmed) {
        Swal.fire({
          title: "Please Wait... ",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await api.put(`auth/user/${userId}/suspend`);
        Swal.close();
        revalidateData();
        Swal.fire({
          title: "User Updated",
          text: "User has been Deactivated",
          icon: "success",
          showCloseButton: true,
        });
      }
    } catch (error: any) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  const revalidateData = async () => {
    try {
      setLoading(true);
      const response = await api.get("auth/user");
      setUsers(response.data);
      setLoading(false);
    } catch (error: any) {
      window.location.reload();
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error,
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div>
          <section className="bg-primary-subtle ">
            <div className="px-3  fw-bold fs-3">User Manager</div>
          </section>
          <section className="w-75 border border-2 rounded-2 p-1 m-2">
            <div>
              {isLoading ? (
                <MiniLoader />
              ) : (
                <table className="table table-sm table-bordered w-100">
                  <thead className="table-dark position-sticky top-0">
                    <tr className="small" style={{ fontSize: "" }}>
                      <th>name</th>
                      <th>user name</th>
                      <th>Status</th>
                      <th>Access Levels</th>
                      <th>Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => {
                      return (
                        <Fragment key={user.id}>
                          <tr key={user.id}>
                            <td rowSpan={user.accessLevels.length}>{user.name}</td>
                            <td rowSpan={user.accessLevels.length}>{user.username}</td>
                            <td rowSpan={user.accessLevels.length}>{user.status}</td>
                            <td>{user.accessLevels[0].access}</td>
                            <td rowSpan={2} className=" ">
                              <div className="d-flex align-content-center justify-content-center flex-column align-items-center ">
                                <img
                                  src={editIcon}
                                  onClick={() => {
                                    Swal.fire({
                                      text: "the feature will be available soon",
                                    });
                                  }}
                                  alt=""
                                  className="btn mt-2 btn-sm btn-outline-secondary"
                                />
                                {user.status == "ACTIVE" ? (
                                  <img
                                    src={inactiveIcon}
                                    alt=""
                                    onClick={() => {
                                      deactivateUser(user.id);
                                    }}
                                    className="btn mt-3 btn-sm btn-outline-secondary"
                                  />
                                ) : (
                                  <img
                                    onClick={() => {
                                      activateUser(user.id);
                                    }}
                                    src={activeIcon}
                                    alt=""
                                    className="btn mt-3 btn-sm btn-outline-secondary"
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                          {user.accessLevels.slice(1).map((level: any) => (
                            <tr key={`${user.id}.${level.id}`}>
                              <td>{level.access}</td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
