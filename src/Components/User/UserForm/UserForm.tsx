import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";
import api from "../../../api";

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
  });

  // Submit handler
  const onSubmit = async (data: FormData) => {
    console.log({ ...data, accessLevels: data.accessLevels.map((element) => element.value) });
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
    <form className={className} onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-2">
        <label>Name</label>
        <input className="form-control" type="text" {...register("name")} />
        {errors.name && <p className="text-danger">{errors.name.message}</p>}
      </div>

      <div className="mb-2">
        <label>User Name</label>
        <input className="form-control" type="text" {...register("username")} />
        {errors.username && <p className="text-danger">{errors.username.message}</p>}
      </div>

      <div className="mb-2">
        <label>Password</label>
        <input className="form-control" type="text" {...register("password")} />
        {errors.password && <p className="text-danger">{errors.password.message}</p>}
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
        {errors.accessLevels && <p className="text-danger">{errors.accessLevels.message}</p>}
      </div>

      <button className="btn btn-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting" : "Submit"}
      </button>
    </form>
  );
}
