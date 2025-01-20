import api from "../api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

export default function UploadAttendenceSheet() {
  const fileSchema = z.object({
    file: z
      .custom<FileList>((files) => files instanceof FileList && files.length > 0, {
        message: "Please upload an Excel file.",
      })
      .refine(
        (files) =>
          [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
          ].includes(files[0]?.type),
        {
          message: "Only Excel files (.xlsx, .xls) are allowed",
        }
      ),
    year: z.string().regex(/^\d{4}$/, "Invalid Format, e.g., 2024"),
    month: z.coerce.number().gt(0).lt(13),
  });

  type FormData = z.infer<typeof fileSchema>;

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(fileSchema) });

  const onSubmit = async (data: FormData) => {
    try {
      Swal.fire({
        title: "Please Wait... ",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const formData = new FormData();
      formData.append("attendence_sheet", data.file[0]);
      formData.append("month", data.month + "");
      formData.append("year", data.year + "");
      const response = await api.post("/api/attendence", formData, { responseType: "blob" });
      console.log(response.data);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      // Set a default filename for the download
      a.download = `${data.year}-${data.month} - attendence report.xlsx`;
      // Append the link to the document body and click it programmatically
      document.body.appendChild(a);
      a.click();
      Swal.fire({
        title: "Successfully analyzed!",
        text: "check the downloads for the excel sheet",
        icon: "success",
      });
      // Clean up the URL object and remove the link from the document
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
        footer: '<a href="#">Why do I have this issue?</a>',
      });
      console.log(error);
    }
  };

  return (
    <MainContainer title="Upload Attendence Sheet" breadCrumbs={["Home", "Attendence", "Upload"]}>
      <SubContainer>
        <section className=" bg-body-tertiary px-2 mt-1">
          <div className="container-fluid border border-dark rounded-2 my-2">
            <div className="fw-semibold">
              <div>
                * before uploading the excel file make sure that excel sheet is in the correct
                format
              </div>
              <div> *provide the correct month and year of the uploaded excel file.</div>
              <div>
                * old records corresponding to the month will be deleted from the database and new
                records will be added upon uploading.
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-3">
              <div className="mb-3">
                <label className="form-label">Year</label>
                <input type="text" {...register("year")} className="form-control" />
                {errors.year && <p className="text-danger">{errors.year.message}</p>}
              </div>
              <div className="mb-3">
                <label className="form-label">Month</label>
                <input type="text" {...register("month")} className="form-control" />
                {errors.month && <p className="text-danger">{errors.month.message}</p>}
              </div>
              <div className="mb-3">
                <label className="form-label">Default file input example</label>
                <input className="form-control" {...register("file")} type="file" id="formFile" />
                {errors.file && <p className="text-danger">{errors.file.message}</p>}
              </div>
              <div className=" d-flex">
                <button type="submit" className="btn btn-primary ms-auto">
                  Submit
                </button>
              </div>
              {errors.root && <p className="text-danger">{errors.root.message}</p>}
            </form>
          </div>
        </section>
      </SubContainer>
    </MainContainer>
  );
}
