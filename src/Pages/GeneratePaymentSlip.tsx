import api from "../api";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { z } from "zod";
import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import "./GeneratePaymentSlip.css";
import Swal from "sweetalert2";

// Types
interface SummaryItem {
  year: number;
  months: number[];
}

interface LoaderData {
  summaryData: SummaryItem[];
}

interface Summary {
  traineesWithoutBank350: number[];
  selectTrainees: any[];
  traineeCount: number;
}

const formSchema = z.object({
  year: z.string().min(1, "Year is required"),
  month: z.string().min(1, "Month is required"),
  date: z.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    {
      message: "Date must be today or later",
    }
  ),
});

type FormData = z.infer<typeof formSchema>;

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export default function GeneratePaymentSlip() {
  const loaderData = useLoaderData() as LoaderData;
  const [formData, setFormData] = useState<Partial<FormData>>({
    year: "",
    month: "",
    date: getTodayAtMidnight(),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCkecking, setIsChecking] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Get unique years from summary data
  const years = loaderData.summaryData.map((item) => item.year.toString());

  // Get months for selected year
  const selectedYearData = loaderData.summaryData.find(
    (item) => item.year.toString() === formData.year
  );
  const months = selectedYearData?.months.map((m) => m.toString()) || [];

  const handleChange = (field: keyof FormData, value: string | Date) => {
    setFormData((prev) => ({
      ...prev,
      ...(field === "year" ? { month: "" } : {}),
      [field]: value,
    }));
  };

  const checkTraineeDetails = async () => {
    setIsChecking(true);
    setIsChanged(false);

    try {
      const response = await api.get("api/payments/generatePaySlip/summary", {
        params: {
          month: formData.month,
          year: formData.year,
        },
      });
      console.log("Trainee details response:", response.data);
      setSummary(response.data);
      setErrors({});
    } catch (error) {
      console.error("Error fetching trainee details:", error);
    } finally {
      setIsChecking(false);
      setIsChecked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const validatedData = formSchema.parse({
        year: formData.year,
        month: formData.month,
        date: formData.date,
      });

      setErrors({});

      // Show loading alert
      Swal.fire({
        title: "Please Wait...",
        text: "Generating payment slip",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.post(
        "api/payments/generatePaySlip",
        {
          year: validatedData.year,
          month: validatedData.month,
          date: validatedData.date.toISOString(),
          traineeIds:
            summary?.selectTrainees.map(
              (data: { trainee_id: number }) => data.trainee_id
            ) || [],
        },
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${validatedData.year}-${validatedData.month}-payment-slip.txt`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success alert
      await Swal.fire({
        title: "Success!",
        text: "Payment slip has been generated and downloaded",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = error.errors.reduce((acc, curr) => {
          const key = curr.path[0] as keyof FormData;
          acc[key] = curr.message;
          return acc;
        }, {} as Partial<Record<keyof FormData, string>>);
        setErrors(newErrors);

        // Show validation error alert
        await Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Please check the form fields for errors",
        });
      } else {
        console.error("Error generating payment slip:", error);
        // Show general error alert
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong while generating the payment slip!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MainContainer
      title="Generate Payment Slip"
      breadCrumbs={["Home", "Payments", "Generate Payment Slip"]}
    >
      <SubContainer>
        <section
          className="bg-body-tertiary px-2 mt-1 p-4 rounded"
          style={{ maxWidth: "85%" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* Year Select */}
              <div className="form-group">
                <label htmlFor="year" className="form-label">
                  Year
                </label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => {
                    setIsChanged(true);
                    handleChange("year", e.target.value);
                  }}
                  className={`form-select ${errors.year ? "is-invalid" : ""}`}
                  disabled={isGenerating || isCkecking}
                >
                  <option value="">Select Year</option>
                  {years.map((year, index) => (
                    <option key={index} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <div className="invalid-feedback">{errors.year}</div>
                )}
              </div>

              {/* Month Select */}
              <div className="form-group">
                <label htmlFor="month" className="form-label">
                  Month
                </label>
                <select
                  id="month"
                  value={formData.month}
                  onChange={(e) => {
                    setIsChanged(true);
                    handleChange("month", e.target.value);
                  }}
                  className={`form-select ${errors.month ? "is-invalid" : ""}`}
                  disabled={!formData.year || isGenerating || isCkecking}
                >
                  <option value="">Select Month</option>
                  {months.map((month, index) => (
                    <option key={index} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <div className="invalid-feedback">{errors.month}</div>
                )}
              </div>
            </div>

            {
              <div
                className="container-fluid border border-secondary rounded-2 my-3 py-2 overflow-auto"
                style={{ maxHeight: "30vh", maxWidth: "85%", marginLeft: "0" }}
              >
                {!summary ? (
                  <div className="ms-3">Check Slip details...</div>
                ) : (
                  <div className="ms-5">
                    <div
                      className={`fw-bold ${
                        summary?.selectTrainees.length === 0
                          ? "text-danger"
                          : summary?.selectTrainees.length ===
                            summary?.traineeCount
                          ? "text-primary"
                          : "text-danger"
                      }`}
                    >
                      {summary?.selectTrainees.length === 0
                        ? "No trainees found"
                        : `Trainee count - ${summary?.selectTrainees.length}`}
                    </div>
                    {summary?.selectTrainees.length > 0 && (
                      <div
                        className={`fw-bold ${
                          summary.traineesWithoutBank350.length > 0
                            ? "text-danger"
                            : "text-primary"
                        }`}
                      >
                        {summary.traineesWithoutBank350.length > 0 ? (
                          <>
                            Trainees Without Bank Details (Attendance No.) :
                            <div className="trainee-grid ms-3">
                              {summary.traineesWithoutBank350.map(
                                (traineeId, index) => (
                                  <div key={traineeId}>
                                    {index + 1}. {traineeId}
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        ) : (
                          <div>All have Bank details</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            }

            {/* Check button*/}
            <div
              className="form-check d-flex justify-content-end"
              style={{ width: "85%", marginLeft: 0 }}
            >
              <button
                type="button"
                className="btn btn-success"
                onClick={checkTraineeDetails}
                disabled={isGenerating || isCkecking || !formData.month}
              >
                {isCkecking ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Checking...
                  </>
                ) : (
                  "Check"
                )}
              </button>
            </div>

            {/* Date Input */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                Payment Date
              </label>
              <input
                id="date"
                type="date"
                value={formData.date ? formatDateForInput(formData.date) : ""}
                onChange={(e) => handleChange("date", new Date(e.target.value))}
                className={`form-control ${errors.date ? "is-invalid" : ""}`}
                min={formatDateForInput(getTodayAtMidnight())}
                disabled={isGenerating || !isChecked || isChanged || isCkecking}
              />
              {errors.date && (
                <div className="invalid-feedback">{errors.date}</div>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary mt-3"
                disabled={isGenerating || !isChecked || isChanged || isCkecking}
              >
                {isGenerating ? <>Generating...</> : "Generate Slip"}
              </button>
            </div>
          </form>
        </section>
      </SubContainer>
    </MainContainer>
  );
}
