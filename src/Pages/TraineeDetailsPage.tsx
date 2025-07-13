import { useLoaderData, useNavigation } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { useState } from "react";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { utils, writeFileXLSX } from "xlsx";

interface TraineeSummary {
  cert_year: string;
  is_government: number;
  total_trainees: number;
}

interface ProcessedData {
  programme: string;
  paid: number;
  unpaid: number;
  total: number;
}

const getProgrammeType = (cert_year: string): string => {
  if (cert_year.includes("NAITA")) return "NAITA";
  if (cert_year.includes("CERT")) return "Certificate Programmes";
  if (cert_year.includes("SMTI")) return "SMTI";
  if (cert_year.includes("DIP")) return "Diploma Programmes";
  if (cert_year.includes("CINEC")) return "CINEC";
  if (cert_year.includes("UG")) return "Degree Programmes";
  return "Other";
};

const processTraineeData = (data: TraineeSummary[] = []): ProcessedData[] => {
  if (!data || !Array.isArray(data)) return [];

  const programmeMap = new Map<string, ProcessedData>();

  data.forEach((item) => {
    const programme = getProgrammeType(item.cert_year);

    if (!programmeMap.has(programme)) {
      programmeMap.set(programme, {
        programme,
        paid: 0,
        unpaid: 0,
        total: 0,
      });
    }

    const current = programmeMap.get(programme)!;
    if (item.is_government === 1) {
      current.paid += item.total_trainees;
    } else {
      current.unpaid += item.total_trainees;
    }
    current.total += item.total_trainees;
  });

  return Array.from(programmeMap.values());
};

export default function TraineeDetailsPage() {
  const { state } = useNavigation();
  const loaderData = useLoaderData() as {
    active: TraineeSummary[];
    all: TraineeSummary[];
  };
  const [showAllTrainees, setShowAllTrainees] = useState(false);

  const activeTrainees = processTraineeData(loaderData?.active || []);
  const allTrainees = processTraineeData(loaderData?.all || []);

  const handleDownload = async () => {
    try {
      const headers = [
        "Training Programme",
        "Paid Count",
        "Unpaid Count",
        "Total",
      ];
      const dataRows = (showAllTrainees ? allTrainees : activeTrainees).map(
        (data) => [data.programme, data.paid, data.unpaid, data.total]
      );

      const rows = [headers, ...dataRows];
      const book = utils.book_new();
      const sheet = utils.aoa_to_sheet(rows);
      utils.book_append_sheet(book, sheet, "Trainee Details");
      writeFileXLSX(book, "traineeDetails.xlsx", { bookType: "xlsx" });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {state === "loading" ? (
        <Loader />
      ) : (
        <MainContainer
          title="Trainee Details"
          breadCrumbs={["Home", "Trainee", "Trainee Details"]}
        >
          <SubContainer>
            <div style={{ maxWidth: "1200px" }} className="mx-auto">
              <div className="bg-body-secondary p-2 mb-2 rounded-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showAllTrainees"
                    checked={showAllTrainees}
                    onChange={(e) => setShowAllTrainees(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="showAllTrainees">
                    Show All Trainees (Including Inactive)
                  </label>
                </div>
              </div>

              <div className="border border-2 rounded-2 p-3">
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Programme</th>
                        <th>Payment Allowed</th>
                        <th>Payment not Allowed</th>
                        <th>Total Trainees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllTrainees ? allTrainees : activeTrainees).map(
                        (data, index) => (
                          <tr key={index}>
                            <td>{data.programme}</td>
                            <td>{data.paid}</td>
                            <td>{data.unpaid}</td>
                            <td>{data.total}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                    <tfoot className="table-dark">
                      <tr>
                        <td>Total Trainees</td>
                        <td>
                          {(showAllTrainees
                            ? allTrainees
                            : activeTrainees
                          ).reduce((sum, data) => sum + data.paid, 0)}
                        </td>
                        <td>
                          {(showAllTrainees
                            ? allTrainees
                            : activeTrainees
                          ).reduce((sum, data) => sum + data.unpaid, 0)}
                        </td>
                        <td>
                          {(showAllTrainees
                            ? allTrainees
                            : activeTrainees
                          ).reduce((sum, data) => sum + data.total, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleDownload}
                >
                  Download Records
                </button>
              </div>
            </div>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
