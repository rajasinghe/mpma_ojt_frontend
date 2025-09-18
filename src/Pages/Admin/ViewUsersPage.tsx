import {
  Link,
  useLoaderData,
  useNavigation,
  useNavigate,
} from "react-router-dom";
import Loader from "../../Components/ui/Loader/Loader";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../api";
import MiniLoader from "../../Components/ui/Loader/MiniLoader";
import { MainContainer } from "../../layout/containers/main_container/MainContainer";
import SubContainer from "../../layout/containers/sub_container/SubContainer";
import "./view-users.css";
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
            <div className="container-fluid">
              <div className="row justify-content-center">
                <div className="col-12">
                  <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center py-3">
                      <h5 className="mb-0">
                        <i className="fas fa-users me-2"></i>
                        User Management
                      </h5>
                      <Link
                        to={"/OJT/users/create"}
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-plus me-1"></i>
                        Create User
                      </Link>
                    </div>
                    <div className="card-body p-0">
                      {isLoading ? (
                        <div className="text-center py-5">
                          <MiniLoader />
                        </div>
                      ) : (
                        <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                          <table className="table table-hover table-striped mb-0">
                            <thead className="table-dark position-sticky top-0">
                              <tr>
                                <th className="py-3">
                                  <i className="fas fa-user me-2"></i>Name
                                </th>
                                <th className="py-3">
                                  <i className="fas fa-at me-2"></i>Username
                                </th>
                                <th className="py-3">
                                  <i className="fas fa-circle me-2"></i>Status
                                </th>
                                <th className="py-3">
                                  <i className="fas fa-shield-alt me-2"></i>Access Levels
                                </th>
                                <th className="py-3 text-center">
                                  <i className="fas fa-cogs me-2"></i>Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user: any) => {
                                const statusBadge = user.status === "ACTIVE"
                                  ? "badge bg-success"
                                  : user.status === "SUSPENDED"
                                  ? "badge bg-warning"
                                  : "badge bg-secondary";

                                return (
                                  <tr key={user.id} className="align-middle">
                                    <td className="fw-medium">{user.name}</td>
                                    <td>{user.username}</td>
                                    <td>
                                      <span className={`badge ${statusBadge}`}>
                                        {user.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex flex-wrap gap-1">
                                        {user.accessLevels.map((level: any, index: number) => (
                                          <span key={index} className="badge bg-info text-dark">
                                            {level.access}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex flex-column gap-1 align-items-center">
                                        <button
                                          onClick={() => navigate(`/OJT/users/${user.id}/update`)}
                                          className="btn btn-outline-primary btn-sm"
                                          title="Update User"
                                        >
                                          <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                          onClick={() => handleDelete(user.id)}
                                          className="btn btn-outline-danger btn-sm"
                                          title="Delete User"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                        {user.status === "ACTIVE" ? (
                                          <button
                                            onClick={() => deactivateUser(user.id)}
                                            className="btn btn-outline-warning btn-sm"
                                            title="Deactivate User"
                                          >
                                            <i className="fas fa-ban"></i>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => activateUser(user.id)}
                                            className="btn btn-outline-success btn-sm"
                                            title="Activate User"
                                          >
                                            <i className="fas fa-check"></i>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {!isLoading && users.length === 0 && (
                      <div className="card-body text-center py-5">
                        <i className="fas fa-users fa-3x text-muted mb-3"></i>
                        <h5 className="text-muted">No Users Found</h5>
                        <p className="text-muted">Start by creating your first user.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
