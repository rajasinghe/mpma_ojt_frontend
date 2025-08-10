import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";
import api from "../../../api";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  name?: string;
  username?: string;
  accessLevels?: Array<{
    id: number;
    access: string;
    userId: number;
  }>;
}

interface Props {
  user?: User;
  className?: string;
  defaultLevels: any;
}

const schema = z.object({
  id: z.number().optional(),
  name: z.string(),
  username: z.string(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .or(z.literal(""))
    .optional(),
  accessLevels: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ),
});

type FormData = z.infer<typeof schema>;

export default function UserForm({ user, defaultLevels, className }: Props) {
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      password: "",
      accessLevels:
        user?.accessLevels?.map((level) => ({
          label: level.access,
          value: level.access,
        })) || [],
    },
  });

  const navigate = useNavigate();

  // Submit handler
  const onSubmit = async (data: FormData) => {
    try {
      const response = await Swal.fire({
        title: "Update User",
        text: "This will update the user information",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Update User",
      });
      if (response.isConfirmed) {
        Swal.fire({
          title: "Please Wait",
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const apiResponse = await api.put(`/auth/user/${user?.id}`, {
          ...data,
          accessLevels: data.accessLevels.map((element) => element.value),
        });
        if (apiResponse.status === 200 || apiResponse.status === 201) {
          Swal.fire({
            title: "Updated!",
            text: "User has been updated successfully",
            icon: "success",
            showCloseButton: true,
          });
          navigate("/OJT/users");
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-2">
        <label>Name</label>
        <input className="form-control" type="text" {...register("name")} />
        {errors.name && <p className="text-danger">{errors.name.message}</p>}
      </div>

      <div className="mb-2">
        <label>User Name</label>
        <input className="form-control" type="text" {...register("username")} />
        {errors.username && (
          <p className="text-danger">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-2">
        <label>New Password</label>
        <input
          className="form-control"
          placeholder="Leave a blank to not change password..."
          type="text"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-danger">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-2">
        <label htmlFor="">Access Levels</label>
        <Controller
          name="accessLevels"
          control={control}
          render={({ field }) => {
            return (
              <Select
                {...field}
                isMulti={true}
                options={Object.entries(defaultLevels).map(([key, value]) => {
                  return {
                    label: key + "",
                    value: value + "",
                  };
                })}
              />
            );
          }}
        />
        {errors.accessLevels && (
          <p className="text-danger">{errors.accessLevels.message}</p>
        )}
      </div>

      <button className="btn btn-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting" : "Submit"}
      </button>
    </form>
  );
}
