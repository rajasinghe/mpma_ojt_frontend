import { useLoaderData, useNavigation, useSearchParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import optionsIcon from "../assets/icons8-options-48.png";
import ReactSelect from "react-select";
import "./ViewTrainee.css";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import api from "../api";
import Loader from "../Components/ui/Loader/Loader";
import MiniLoader from "../Components/ui/Loader/MiniLoader";
import Swal from "sweetalert2";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { FixedSizeGrid as Grid } from 'react-window';
import { utils, writeFileXLSX } from "xlsx";


interface loaderProps {
  trainees: [];
  workingDays: [];
  summary: [];
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

const filterSchema = z.object({
  month: z.object({
    value: z.string(),
    label: z.string(),
  }),
  year: z.object({
    value: z.string(),
    label: z.string(),
  }),
  traineeId: z.coerce.number().optional(),
});

type filterFormValues = z.infer<typeof filterSchema>;

export default function PaymentsPage() {
  const loaderData = useLoaderData() as loaderProps;
  /* here the trainees means a object which has the attendences related to each trainee */
  const [trainees, setTrainees] = useState(loaderData.trainees);
  const [trainee, setTrainee] = useState<any | null>(null);
  const [matchingTrainees, setMatchingTrainees] = useState<any>(loaderData.trainees);
  //const [trainee_id, setTraineeId] = useState<null | number>(null);
  const [keyword, setKeyword] = useState<string>("");

  const [workingDays, setWorkingDays] = useState<string[]>(loaderData.workingDays);
  

  //const [show, setShow] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState<filterFormValues | null>(null);
  const [resultCount, setResultCount] = useState<number>(loaderData.trainees.length);
  const [searchCount, setSearchCount] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [params] = useSearchParams();

  const columnWidth: number = 150; // Adjusted width to accommodate the new headers
  const rowHeight: number = 51; // Height of each row in pixels 
  const [height, setHeight] = useState<number>(0);

  const today = new Date();
  const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  
  useEffect(() => {
    const updateHeight = () => {
      // Calculate height based on number of rows plus header row
      const numberOfRows = matchingTrainees.length + 1; 
      const calculatedHeight = (numberOfRows * rowHeight) + 15;
      
      // Get viewport height
      const viewportHeight = window.innerHeight;
      // Maximum height should be 53vh
      const maxHeight = Math.floor(viewportHeight * 0.53);
      
      // Use the smaller of calculated height or maxHeight
      const newHeight = Math.min(calculatedHeight, maxHeight);
      
      setHeight(newHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [matchingTrainees.length]); // Re-run when number of rows changes

  const {
    formState: { errors },
    setError,
    control,
    reset,
    setValue,
    watch,
    handleSubmit,
  } = useForm<filterFormValues>({
    defaultValues: {
      month: filterOptions?.month || { value: lastMonth.toString(), label: lastMonth.toString() },
      year: filterOptions?.year || { value: lastMonthYear.toString(), label: lastMonthYear.toString() },
      traineeId: filterOptions?.traineeId
    }
  });

  const { state } = useNavigation();

  const [gridWidth, setGridWidth] = useState<number>(0);

  useEffect(() => {
    if (!filterOptions) {
      setFilterOptions({
        month: { value: lastMonth.toString(), label: lastMonth.toString() },
        year: { value: lastMonthYear.toString(), label: lastMonthYear.toString() }
      });
    }
  }, []);

  useEffect(() => {
    setMatchingTrainees(trainees);
    setResultCount(trainees.length);
    //console.log(trainees);
  }, [trainees]);

  useEffect(() => {
    if (filterOptions == null) {
      //fetch all the records available
      //getAllData();
    } else {
      //send the filter options to the backend for analyse and fetch the data accordingly
      try {
        let filter = {
          month: filterOptions.month.value,
          year: filterOptions.year.value,
          traineeId: filterOptions.traineeId,
        };
        const getFilteredData = async (filterParams: typeof filter) => {
          //set loading state
          console.log(filterParams);
          setLoading(true);
          if (filterParams.month && filterParams.year) {
            const [attendencesResponse, workingDaysResponse, selectedTrainee] = await Promise.all([
              api.get("api/attendence", {
                params: {
                  month: filterParams.month,
                  year: filterParams.year,
                  trainee_id: filterParams.traineeId,
                },
              }),
              api.get(`api/calender/${filterParams.year}/${filterParams.month}`),
              api.get("api/attendence/generatePaySlip/summary", {
                params: {
                  month: filterParams.month,
                  year: filterParams.year,
                },
              }),
            ]);
            console.log(workingDaysResponse.data);

            // Filter and sort trainees based on selectedTrainees order
            const filteredTrainees = selectedTrainee.data.traineeIds
              .map((id: number) => 
                attendencesResponse.data.find(
                  (trainee: { trainee_id: number }) => trainee.trainee_id === id
                )
              )
              .filter(Boolean);            

            setWorkingDays(workingDaysResponse.data);
            setTrainees(filteredTrainees);
          }
          setLoading(false);
        };
        getFilteredData(filter);
      } catch (error) {
        console.log(error);
        setFilterOptions(null);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
    }
  }, [filterOptions]);

  const updateGridWidth = () => {

    const containerWidth = window.innerWidth;
    setGridWidth(containerWidth);
  };

  useEffect(() => {
    updateGridWidth();
    window.addEventListener("resize", updateGridWidth);
    return () => {
      window.removeEventListener("resize", updateGridWidth);
    };
  }, []);

  const handleSearch = (keyword: string) => {
    if (keyword.trim() != "") {
      const searchResults = fuse.search(keyword);
      const resultingTrainees = searchResults.map((result) => {
        //console.log(result);
        return result.item;
      });
      setSearchCount(searchResults.length);
      setMatchingTrainees(resultingTrainees);
    } else {
      setResultCount(trainees.length);
      setMatchingTrainees(trainees);
    }
  };

  const [months, setMonths] = useState<any[]>([]);

  const year = watch("year");
  //const month = watch("month");

  useEffect(() => {
    console.log(loaderData.summary);
    setValue("month", { value: "", label: "" });
    if (year) {
      const yearSummary: any = loaderData.summary.find((record: any) => {
        return record.year == year.value;
      });
      yearSummary && setMonths(yearSummary.months || []);
    }
  }, [year]);

  const fuse = new Fuse(trainees, {
    keys: ["ATT_NO", "REG_NO", "name"],
    isCaseSensitive: false,
    includeScore: true,
    includeMatches: true,
    shouldSort: true,
    threshold: 0.1,
    minMatchCharLength: 2,
  });

  const onSubmit = async (data: filterFormValues) => {
    console.log(data);
    let values = data;
    if (filterOptions && filterOptions.traineeId) {
      values.traineeId = filterOptions.traineeId;
    }

    if ((data.month && data.year)) {
      setFilterOptions(values);
      setFilterVisible(false);
    } else {
      setError("root", { message: "one of the filters must be used to filter data " });
    }
  };

  const handleDownload = () => {
    console.log("click");
    if (workingDays && matchingTrainees.length > 0) {
      try {
        const headers = [
          "S/NO",
          "ATTN NO",
          "REG NO",
          "END DATE",
          "NAME",
          ...workingDays,
          "ATTN TOTAL",
          "PAY AMOUNT(Rs)",
        ];  /* [id,date1,date2,date3]*/

        let rows = [headers];
        let sNo = 0;
        console.log(matchingTrainees);

        matchingTrainees.forEach((trainee: any) => {
          sNo++;
          let row = [sNo, trainee.ATT_NO, trainee.REG_NO, trainee.end_date.split('T')[0], trainee.name];
          
          // Track attendance total for this trainee
          let attendanceTotal = 0;
          
          workingDays.forEach((day) => {
            const attendence = trainee.attendences.find(
              (attendence: any) => attendence.date == day
            );
            if (attendence) {
              row.push(attendence.status);
              if (attendence.status === 1) {
                attendanceTotal++;
              }
            } else {
              throw new Error(
                `mismatch occured no attendece record  trainee-id-${trainee.id} for day-${day}!`
              );
            }
          });

          // Add attendance total and payment amount
          const payAmount = attendanceTotal * 500;
          row.push(attendanceTotal);
          row.push(`Rs. ${payAmount}`);
          
          rows.push(row);
        });
        const book = utils.book_new();

        const sheet = utils.aoa_to_sheet(rows);
        utils.book_append_sheet(book, sheet, "Register");
        writeFileXLSX(book, `attendence report.xlsx`, { bookType: "xlsx" });

      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message || "un expected error occured",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
    } else {
      console.log(workingDays, trainees);
    }
  };

  let rowCount = matchingTrainees.length+1;
  let columnCount = 7; // Number of headers

  const Cell = ({ columnIndex, rowIndex, style }: CellProps) => {
    const trainee = matchingTrainees?.[rowIndex - 1] || {};
    const headers = ["S/NO", "ATT_NO", "REG NO", "END DATE", "NAME", "ATTN TOTAL", "PAY AMOUNT(Rs)"];

    // Header row
    if (rowIndex === 0) {
      return (
        <div style={{ 
          ...style,
          width: columnWidth,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          border: "1px solid #ddd",
          padding: "8px",
          backgroundColor: '#212529',
          color: '#fff',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {headers[columnIndex]}
        </div>
      );
    }

    // Calculate attendance total and pay amount
    const attendanceTotal = trainee.attendences?.reduce((total: number, att: any) => {
      return total + (att.status === 1 ? 1 : 0);
    }, 0) || 0;

    const payAmount = attendanceTotal * 500; // Rs. 500 per day

    let cellContent = "";
    switch (columnIndex) {
      case 0:
        cellContent = rowIndex.toString();
        break;
      case 1:
        cellContent = trainee.ATT_NO || '';
        break;
      case 2:
        cellContent = trainee.REG_NO || '';
        break;
      case 3:
        cellContent = trainee.end_date ? trainee.end_date.split('T')[0] : '';
        break;
      case 4:
        cellContent = trainee.name || '';
        break;
      case 5:
        cellContent = attendanceTotal.toString();
        break;
      case 6:
        cellContent = `Rs. ${payAmount}`;
        break;
    }
    return (
      <div style={{
        ...style,
        border: "1px solid #ddd",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px'
      }}>
        {cellContent}
      </div>
    );
  };

  return (
    <>
      {state == "loading" ? (
        <div>
          <Loader />
        </div>
      ) : (
        <MainContainer title="Payments" breadCrumbs={["Home", "Payments"]}>
          {/*search bar  */}
          <SubContainer>
            <div className="bg-body-secondary p-2 mb-2 rounded-2 position-relative">
              {/* serach box */}
              <div className="d-flex">
                <input
                  className=" form-control"
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
                <button className="btn shadow ms-2 btn-outline-warning">
                  <img
                    src={optionsIcon}
                    height={"30px"}
                    alt=""
                    onClick={() => {
                      setFilterVisible(true);
                    }}
                  />
                </button>
              </div>

              {/* filter options display */}
              <div
                className="ms-1 mt-1 pe-4 fw-semibold d-flex"
                style={{
                  fontSize: "12px",
                }}
              >
                <div>
                  <div>Filters Applied :-</div>
                  {filterOptions && filterOptions.month && filterOptions.year ? (
                    <span
                      className="badge bg-primary ms-1"
                      style={{ fontSize: "8px" }}
                    >{`${filterOptions.year.value} - ${filterOptions.month.value}`}</span>
                  ) : (
                    ""
                  )}
                  {filterOptions && trainee && trainee.id ? (
                    <span
                      className="badge bg-primary ms-1"
                      style={{ fontSize: "8px" }}
                    >{`${trainee.ATT_NO} `}</span>
                  ) : (
                    ""
                  )}
                </div>
                <div className="ms-auto">
                  <div className="">Total Count - {resultCount}</div>
                  <div>Search Count - {searchCount}</div>
                </div>
              </div>
            </div>
            <div className="border border-2 rounded-2 p-1">
              <div
                className=" table-responsive rounded-2"
                style={{ maxHeight: "53vh", overflow: "hidden"}}
              >
                {loading ? (
                  <MiniLoader />
                ) : (
                <div style={{ overflow: "hidden" }}>
                <Grid
                  className="table table-sm table-bordered w-100"
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  height={height}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={gridWidth}
                >
                  {Cell}
                </Grid>

                </div>
                )}
              </div>
            </div>
            <div className=" d-flex mt-2 ">
              <button
                type="button"
                className="btn btn-success btn-sm ms-2"
                onClick={handleDownload}
              >
                Download Payment Records
              </button>
            </div>

            {/* filter model */}
            <Modal
              show={filterVisible}
              onHide={() => {
                setFilterVisible(false);
              }}
            >
              <Modal.Header closeButton>
                <div className=" fw-bold  w-100 ">Filters</div>
              </Modal.Header>
              <Modal.Body>
                <form className="">
                  {errors.root && <p className="text-danger m-0">{errors.root.message}</p>}

                  <div className="mt-2 mb-2">
                    <div className="ps-1 mt-1 container">
                      <div className="row">
                        <div className=" fw-semibold">Year</div>
                        <div className="ps-1 mt-1">
                          <Controller
                            name="year"
                            control={control}
                            render={({ field }) => {
                              return (
                                <ReactSelect
                                  {...field}
                                  options={loaderData.summary.map((record: any) => ({
                                    value: record.year,
                                    label: record.year,
                                  }))}
                                />
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className=" fw-semibold">Month</div>
                        <div className="ps-1 mt-1">
                          <Controller
                            name="month"
                            control={control}
                            render={({ field }) => {
                              return (
                                <ReactSelect
                                  {...field}
                                  options={months.map((month: any) => ({
                                    value: month,
                                    label: month,
                                  }))}
                                />
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer>
                <button
                  className=" ms-auto btn btn-sm  btn-success"
                  onClick={handleSubmit(onSubmit)}
                >
                  Apply Filters
                </button>
                <button
                  className=" btn btn-danger btn-sm"
                  onClick={() => {
                    reset();
                    setFilterOptions(null);
                    setFilterVisible(false);
                  }}
                >
                  Reset
                </button>
              </Modal.Footer>
            </Modal>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
