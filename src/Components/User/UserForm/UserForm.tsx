import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";
import api from "../../../api";
import { useNavigate } from "react-router-dom";
import "./user-form.css";

interface Props {
  user?: Partial<FormData>;
  className?: string;
  defaultLevels: any;
}

const schema = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accessLevels: z.array(z.object({ value: z.string() })),
});

type FormData = z.infer<typeof schema>;

export default function UserForm({ defaultLevels, className }: Props) {
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      accessLevels: [],
    },
  });

  const navigate = useNavigate();
  // Submit handler
  const onSubmit = async (data: FormData) => {
    console.log({
      ...data,
      accessLevels: data.accessLevels.map((element) => element.value),
    });
    try {
      const response = await Swal.fire({
        title: "Create new User",
        text: "This will create a new User",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Create User",
      });
      if (response.isConfirmed) {
        Swal.fire({
          title: "Please Wait",
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const response = await api.post("/auth/create", {
          ...data,
          accessLevels: data.accessLevels.map((element) => element.value),
        });
        if (response.status == 201) {
          Swal.fire({
            title: "Inserted!",
            text: "New User has been created",
            icon: "success",
            showCloseButton: true,
          });
          navigate("/OJT/users");
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops..server sent a unexpected status code.",
            text: "please check again if the user has been created ",
            footer: '<a href="#">Why do I have this issue?</a>',
          });
        }
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

  return (
    <div className={`container-fluid ${className}`}>
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-gradient-success text-white text-center py-4">
              <h4 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Create New User
              </h4>
            </div>
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <input
                      className={`form-control ${
                        errors.name ? "is-invalid" : ""
                      }`}
                      type="text"
                      id="name"
                      placeholder="Enter full name"
                      {...register("name")}
                    />
                    <label htmlFor="name">
                      <i className="fas fa-user me-2"></i>Full Name
                    </label>
                    {errors.name && (
                      <div className="invalid-feedback">
                        {errors.name.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <input
                      className={`form-control ${
                        errors.username ? "is-invalid" : ""
                      }`}
                      autoComplete="new-password"
                      type="text"
                      id="username"
                      placeholder="Enter username"
                      {...register("username")}
                    />
                    <label htmlFor="username">
                      <i className="fas fa-at me-2"></i>Username
                    </label>
                    {errors.username && (
                      <div className="invalid-feedback">
                        {errors.username.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="form-floating">
                  <input
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                    autoComplete="new-password"
                    placeholder="Enter password"
                    type="password"
                    id="password"
                    {...register("password")}
                  />
                  <label htmlFor="password">
                    <i className="fas fa-lock me-2"></i>Password
                  </label>
                  {errors.password && (
                    <div className="invalid-feedback">
                      {errors.password.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold mb-3">
                  <i className="fas fa-shield-alt me-2"></i>Access Levels
                </label>
                <div className="border rounded-3 p-3 bg-light">
                  <Controller
                    name="accessLevels"
                    control={control}
                    render={({ field }) => {
                      const selectedValues =
                        field.value?.map((item: any) => item.value) || [];
                      return (
                        <div className="row">
                          {Object.entries(defaultLevels).map(([key, value]) => {
                            const isChecked = selectedValues.includes(
                              value + ""
                            );
                            return (
                              <div key={key} className="col-md-6 mb-2">
                                <div className="form-check form-check-inline w-100">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`access-${key}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newValue = value + "";
                                      let newSelected;
                                      if (e.target.checked) {
                                        newSelected = [
                                          ...selectedValues,
                                          newValue,
                                        ];
                                      } else {
                                        newSelected = selectedValues.filter(
                                          (v: string) => v !== newValue
                                        );
                                      }
                                      field.onChange(
                                        newSelected.map((v) => ({ value: v }))
                                      );
                                    }}
                                  />
                                  <label
                                    className="form-check-label fw-medium"
                                    htmlFor={`access-${key}`}
                                  >
                                    <i className="fas fa-check-circle me-2 text-success"></i>
                                    {key}
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                </div>
                {errors.accessLevels && (
                  <div className="text-danger mt-2">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    {errors.accessLevels.message}
                  </div>
                )}
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <button
                  className="btn btn-success btn-lg px-5"
                  disabled={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus me-2"></i>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
