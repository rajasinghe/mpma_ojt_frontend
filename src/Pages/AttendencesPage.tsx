import { Link, useLoaderData, useNavigation, useSearchParams } from "react-router-dom";
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
import FlipableTableCell from "../Components/Tables/FlippableCell/FlipableTableCell";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";
import { FixedSizeGrid as Grid } from 'react-window';


interface loaderProps {
  trainees: [];
  workingDays: [];
  departments: [];
  programs: [];
  institutes: [];
  summary: [];
  trainee: any;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

const filterSchema = z.object({
  departments: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable()
    .optional(),
  programmes: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable()
    .optional(),
  institutes: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable()
    .optional(),
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

export default function AttendencesPage() {
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

  const columnWidth: number = 105; // Width of each column in pixels
  const rowHeight: number = 51; // Height of each row in pixels 
  const [height, setHeight] = useState<number>(0);
  
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
  } = useForm<filterFormValues>();

  const { state } = useNavigation();

  const [gridWidth, setGridWidth] = useState<number>(0);

  useEffect(() => {
    const month = params.get("month");
    const year = params.get("year");
    const id = params.get("id");

    const schema = z.object({
      month: z.coerce.number().int().gte(0).lte(13),
      year: z.coerce.number().int().gte(2001),
      id: z.coerce.number(),
    });

    try {
      const data = schema.parse({
        month,
        year,
        id,
      });
      api.get(`api/trainee/${data.id}`).then((res) => {
        console.log(res);
        setTrainee(res.data);
      });
      setFilterOptions({
        month: {
          value: data.month + "",
          label: data.month + "",
        },
        year: {
          value: data.year + "",
          label: data.year + "",
        },
        traineeId: data.id,
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    setMatchingTrainees(trainees);
    setResultCount(trainees.length);
    console.log(trainees);
  }, [trainees]);

  useEffect(() => {
    if (filterOptions == null) {
      //fetch all the records available
      //getAllData();
    } else {
      //send the filter options to the backend for analyse and fetch the data accordingly
      try {
        const departments = filterOptions.departments?.map((department) => {
          return department.value;
        });
        const programmes = filterOptions.programmes?.map((programme) => {
          return programme.value;
        });

        const institutes = filterOptions.institutes?.map((institute) => {
          return institute.value;
        });
        let filter = {
          month: filterOptions.month.value,
          year: filterOptions.year.value,
          programmes: programmes,
          departments: departments,
          institutes: institutes,
          traineeId: filterOptions.traineeId,
        };
        const getFilteredData = async (filterParams: typeof filter) => {
          //set loading state
          console.log(filterParams);
          setLoading(true);
          if (filterParams.month && filterParams.year) {
            const [attendencesResponse, workingDaysResponse] = await Promise.all([
              api.get("api/attendence", {
                params: {
                  month: filterParams.month,
                  year: filterParams.year,
                  trainee_id: filterParams.traineeId,
                },
              }),
              api.get(`api/calender/${filterParams.year}/${filterParams.month}`),
            ]);
            console.log(workingDaysResponse.data);
            console.log(attendencesResponse.data);
            /* attendencesResponse.data.array.forEach(element) => {
                if(element)
            }); */
            setWorkingDays(workingDaysResponse.data);
            setTrainees(attendencesResponse.data);
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
        console.log(result);
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

  /* useEffect(() => {
    //in here the year and month is setted to the filterOptions
    //then the chain of useEffects run resulting in fetching the data from the server
  }, [year, months]); */

  const fuse = new Fuse(trainees, {
    keys: ["ATT_NO"],
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

    if (
      (data.departments && data.departments.length > 0) ||
      (data.institutes && data.institutes.length > 0) ||
      (data.programmes && data.programmes.length > 0) ||
      (data.month && data.year)
    ) {
      setFilterOptions(values);
      setFilterVisible(false);
    } else {
      setError("root", { message: "one of the filters must be used to filter data " });
    }
  };

  const handleDownload = () => {
    console.log("click");
    if (workingDays && trainees.length > 0) {
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
        ]; /* [id,date1,date2,date3] */
        let rows = [headers];
        let sNo = 0;
        console.log(trainees);
        /* 
        [
          {
            trainee:12,
            attendences : {
              day1 :prsent,
              day2 : present 
            }
          }
        ]
        */
        trainees.forEach((trainee: any) => {
          sNo++;
          let row = [sNo, trainee.ATT_NO, trainee.REG_NO, trainee.end_date, trainee.name];
          console.log(trainee);
          workingDays.forEach((day) => {
            // console.log(day);
            const attendence = trainee.attendences.find(
              (attendence: any) => attendence.date == day
            );
            if (attendence) {
              console.log(day, attendence);
              row.push(attendence.status);
            } else {
              throw new Error(
                `mismatch occured no attendece record  trainee-id-${trainee.id} for day-${day}!`
              );
            }
          });
          rows.push(row);
        });
        console.log(rows);
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
  let columnCount = workingDays.length;

  const Cell = ({ columnIndex, rowIndex, style }: CellProps) => {
      
    //const trainee = matchingTrainees[rowIndex];
    const trainee = matchingTrainees?.[rowIndex - 1] || {};
    const day = workingDays[columnIndex - 1];

      // First column shows ATT_NO
    if(columnIndex === 0 && rowIndex === 0) {
      return (
        <div style={style}>
          <div style = {{
            ...style,
            display: 'flex',
            fontWeight: 'bold',
            border: '1px solid #ddd',
            backgroundColor:'#212529',
            color: '#fff',
            alignItems: 'center',
          }}>
            Attendance Number
          </div>
        </div>
      );
    }
    
    else if (columnIndex === 0) {
      return (
        <div  style={style}>
          <div style = {{
            ...style,
            position: 'sticky',
            left: 0,
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            padding: '0px',
            justifyContent: 'center',
          }}>
            {trainee.ATT_NO}
          </div>
        </div>
      );
    }

    else if(rowIndex === 0) {

      return (
        <div 
        style={{ 
          ...style,
          width: columnWidth,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
          border: "1px solid #ddd",
          padding: "8px",
          backgroundColor:'#212529',
          color: '#fff',
          fontWeight: 'bold'
        }}
      >
        {day}
        
      </div>
      );
    }

    else {
      const attendance = trainee?.attendences[columnIndex-1];

      return (
        <div style={{...style, 
          border: "1px solid #ddd",
          borderRight: "1px solid #a7b9b1"}}>
          {attendance && (
            <FlipableTableCell
              onTime={attendance.on_time}
              offTime={attendance.off_time}
              status={attendance.status}
            />
          )}
        </div>
      );
    }

  };

  return (
    <>
      {state == "loading" ? (
        <div>
          <Loader />
        </div>
      ) : (
        <MainContainer title="Attendence" breadCrumbs={["Home", "Attendence"]}>
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
                  {filterOptions?.institutes &&
                    filterOptions.institutes.map((institute) => {
                      return (
                        <span
                          key={institute.value}
                          className="badge bg-primary ms-1"
                          style={{ fontSize: "8px" }}
                        >
                          {institute.label}
                        </span>
                      );
                    })}
                  {filterOptions?.departments &&
                    filterOptions.departments.map((department) => {
                      return (
                        <span
                          key={department.value}
                          className="badge bg-primary ms-1"
                          style={{ fontSize: "8px" }}
                        >
                          {department.label}
                        </span>
                      );
                    })}
                  {filterOptions?.programmes &&
                    filterOptions.programmes.map((program) => {
                      return (
                        <span
                          key={program.value}
                          className="badge bg-primary ms-1"
                          style={{ fontSize: "8px" }}
                        >
                          {program.label}
                        </span>
                      );
                    })}

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
                    columnCount={columnCount+1}
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
              <Link to={"/OJT/attendence/new"} className="btn btn-primary btn-sm ms-auto">
                Upload Attendences
              </Link>
              <button
                type="button"
                className="btn btn-success btn-sm ms-2"
                onClick={handleDownload}
              >
                Download Records
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
                  {/*  <div>
                    <div className=" fw-semibold">Training Programmes</div>
                    <div className="ps-1 mt-1">
                      <Controller
                        name="programmes"
                        control={control}
                        render={({ field }) => {
                          return (
                            <ReactSelect
                              {...field}
                              isMulti={true}
                              options={loaderData.programs.map((programme: any) => ({
                                value: programme.id,
                                label: programme.name,
                              }))}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className=" fw-semibold">Institutes</div>
                    <div className="ps-1 mt-1">
                      <Controller
                        name="institutes"
                        control={control}
                        render={({ field }) => {
                          return (
                            <ReactSelect
                              {...field}
                              isMulti={true}
                              options={loaderData.institutes.map((institute: any) => ({
                                value: institute.id,
                                label: institute.name,
                              }))}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className=" fw-semibold">Departments</div>
                    <div className="ps-1 mt-1">
                      <Controller
                        name="departments"
                        control={control}
                        render={({ field }) => {
                          return (
                            <ReactSelect
                              {...field}
                              isMulti={true}
                              options={loaderData.departments.map((department: any) => ({
                                value: department.id,
                                label: department.name,
                              }))}
                            />
                          );
                        }}
                      />
                    </div>
                  </div> */}

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
                    reset({
                      departments: null,
                      institutes: null,
                      programmes: null,
                    });
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
