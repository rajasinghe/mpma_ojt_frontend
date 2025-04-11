import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { z } from "zod";
import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import api from "../api";

interface LoaderProps {
  years: string[];
  months: string[];
}

const formSchema = z.object({
  year: z.string().min(1, "Year is required"),
  month: z.string().min(1, "Month is required"),
  date: z.date().refine(date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    return date >= today;
  }, {
    message: "Date must be today or later",
  }),
});

type FormData = z.infer<typeof formSchema>;

// Helper function to format date as YYYY-MM-DD (for input[type="date"])
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get today's date at midnight (for min date comparison)
const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export default function GeneratePaymentSlip() {
  const { years, months } = useLoaderData() as LoaderProps;
  const [formData, setFormData] = useState<Partial<FormData>>({
    year: "",
    month: "",
    date: getTodayAtMidnight(),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (field: keyof FormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = formSchema.parse({
        year: formData.year,
        month: formData.month,
        date: formData.date,
      });
      setErrors({});
      console.log("Form submitted:", validatedData);
      // Add submission logic here
      const response = await api.get("api/attendence/generatePaySlip" , {
        params: {
          month: validatedData.month,
          year: validatedData.year,
          date: validatedData.date.toISOString(),
        },
        responseType: "blob",
      });
      console.log(response.data);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain'}));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${validatedData.year}-${validatedData.month} - payment slip.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = error.errors.reduce((acc, curr) => {
          const key = curr.path[0] as keyof FormData;
          acc[key] = curr.message;
          return acc;
        }, {} as Partial<Record<keyof FormData, string>>);
        setErrors(newErrors);
      }
    }
  };

  return (
    <MainContainer 
      title="Generate Payment Slip" 
      breadCrumbs={["Home", "Attendance", "Generate Payment Slip"]}
    >
      <SubContainer>
        <section className="bg-body-tertiary px-2 mt-1 p-4 rounded">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Year Select */}
            <div className="form-group">
              <label htmlFor="year" className="form-label">
                Year
              </label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className={`form-select ${errors.year ? "is-invalid" : ""}`}
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
                onChange={(e) => handleChange("month", e.target.value)}
                className={`form-select ${errors.month ? "is-invalid" : ""}`}
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

            {/* Date Input */}
            <div className="form-group mb-3">
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
              />
              {errors.date && (
                <div className="invalid-feedback">{errors.date}</div>
              )}
            </div>
            
            <div>
              <button type="submit" className="btn btn-primary">
                Generate Slip
              </button>
            </div>
          </form>
        </section>
      </SubContainer>
    </MainContainer>
  );
}