import {
  Link,
  useLoaderData,
  useNavigation,
  useNavigate,
} from "react-router-dom";
import Loader from "../../Components/ui/Loader/Loader";
import { Fragment, useEffect, useState } from "react";
import editIcon from "../../assets/edit.png";
import removeIcon from "../../assets/remove.png";
import activeIcon from "../../assets/active.png";
import inactiveIcon from "../../assets/inactive.png";
import Swal from "sweetalert2";
import api from "../../api";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
export default function ViewUsersPage() {
  const { state } = useNavigation();
  const navigate = useNavigate();
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

  const handleDelete = async (userId: number) => {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "Delete User Account",
        text: "Confirm account deletion",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
      });
      if (isConfirmed) {
        Swal.fire({
          title: "Please Wait... ",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await api.delete(`auth/user/${userId}`);
        Swal.close();
        revalidateData();
        Swal.fire({
          title: "User Deleted",
          text: "User has been Deleted",
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
        <MainContainer title="User Manager" breadCrumbs={["Home", "Users"]}>
          <SubContainer>
            <section
              className="border border-2 rounded-2 p-1 m-2 mx-auto"
              style={{ maxWidth: "1200px" }}
            >
              <div>
                {isLoading ? (
                  <MiniLoader />
                ) : (
                  <div className=" table-responsive" style={{ height: "70vh" }}>
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
                                <td rowSpan={user.accessLevels.length}>
                                  {user.name}
                                </td>
                                <td rowSpan={user.accessLevels.length}>
                                  {user.username}
                                </td>
                                <td rowSpan={user.accessLevels.length}>
                                  {user.status}
                                </td>
                                <td>{user.accessLevels[0].access}</td>
                                <td
                                  rowSpan={user.accessLevels.length}
                                  className=" "
                                >
                                  <div className="d-flex align-content-center justify-content-center flex-column align-items-center ">
                                    <img
                                      src={editIcon}
                                      onClick={() => {
                                        navigate(
                                          `/OJT/users/${user.id}/update`
                                        );
                                      }}
                                      alt=""
                                      className="btn mt-2 btn-sm btn-outline-secondary"
                                    />
                                    <img
                                      src={removeIcon}
                                      onClick={() => {
                                        handleDelete(user.id);
                                      }}
                                      alt=""
                                      className="btn ms-2 btn-sm btn-outline-secondary"
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        padding: "5px",
                                        margin: "10px",
                                      }}
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
                  </div>
                )}
              </div>
            </section>
            <div className="d-flex m-1 mx-auto" style={{ maxWidth: "1200px" }}>
              <Link
                to={"/OJT/users/create"}
                className="ms-auto btn btn-sm btn-primary"
              >
                Create User
              </Link>
            </div>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
