import { Link, useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import Fuse from "fuse.js";
import optionsIcon from "../assets/icons8-options-48.png";
import ReactSelect from "react-select";
import "./ViewTrainee.css";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import api from "../api";
import Loader from "../Components/Loader/Loader";
import MiniLoader from "../Components/Loader/MiniLoader";
import Swal from "sweetalert2";
import FlipableTableCell from "../Components/Tables/FlippableCell/FlipableTableCell";

interface loaderProps {
  trainees: [];
  workingDays: [];
  departments: [];
  programs: [];
  institutes: [];
}

const filterSchema = z.object({
  departments: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable(),
  programmes: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable(),
  institutes: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .nullable(),
  start_date: z.date().nullable(),
  end_date: z.date().nullable(),
});

type filterFormValues = z.infer<typeof filterSchema>;

export default function AttendencesPage() {
  const loaderData = useLoaderData() as loaderProps;
  /* here the trainees means a object which has the attendences related to each trainee */
  const [trainees, setTrainees] = useState(loaderData.trainees);

  const [matchingTrainees, setMatchingTrainees] = useState<any>(loaderData.trainees);

  const [keyword, setKeyword] = useState<string>("");

  const [workingDays, setWorkingDays] = useState<string[]>(loaderData.workingDays);

  const [show, setShow] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState<filterFormValues | null>(null);
  const [resultCount, setResultCount] = useState<number>(loaderData.trainees.length);
  const [searchCount, setSearchCount] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    formState: { errors },
    setError,
    control,
    reset,
    handleSubmit,
  } = useForm<filterFormValues>();
  const { state } = useNavigation();

  useEffect(() => {
    setMatchingTrainees(trainees);
    setResultCount(trainees.length);
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
          start_date: filterOptions.start_date,
          end_date: filterOptions.end_date,
          programmes: programmes,
          departments: departments,
          institutes: institutes,
        };

        const getFilteredData = async (filterParams: typeof filter) => {
          //set loading state
          console.log(filterParams);
          setLoading(true);
          if (filterOptions.start_date) {
            const startDate = new Date(filterOptions.start_date);

            const [attendencesResponse, workingDaysResponse] = await Promise.all([
              api.get("api/attendence", {
                params: {
                  month: startDate.getMonth() + 1,
                  year: startDate.getFullYear(),
                },
              }),
              api.get(`api/calender/${startDate.getFullYear()}/${startDate.getMonth() + 1}`),
            ]);
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

  const handleSearch = (keyword: string) => {
    if (keyword.trim() != "") {
      const searchResults = fuse.search(keyword);
      const resultingTrainees = searchResults.map((result) => {
        return result.item;
      });
      setSearchCount(searchResults.length);
      setMatchingTrainees(resultingTrainees);
    } else {
      setResultCount(trainees.length);
      setMatchingTrainees(trainees);
    }
  };

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
    if (
      (data.departments && data.departments.length > 0) ||
      (data.institutes && data.institutes.length > 0) ||
      (data.programmes && data.programmes.length > 0) ||
      data.start_date ||
      data.end_date
    ) {
      setFilterOptions(data);
      setFilterVisible(false);
    } else {
      setError("root", { message: "one of the filters must be used to filter data " });
    }
  };

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <div className="">
          {/* header section */}
          <section className="bg-primary-subtle ">
            <div className="px-3  fw-bold fs-3">Trainee Attendeces</div>
          </section>

          <section className="px-2 mt-1">
            {/*  */}
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
              <div className="ms-1 mt-1 pe-4 fw-semibold d-flex">
                <div>
                  <div>Filters Applied :-</div>
                  {filterOptions?.institutes &&
                    filterOptions.institutes.map((institute) => {
                      return (
                        <span key={institute.value} className="badge bg-primary ms-1">
                          {institute.label}
                        </span>
                      );
                    })}
                  {filterOptions?.departments &&
                    filterOptions.departments.map((department) => {
                      return (
                        <span key={department.value} className="badge bg-danger ms-1">
                          {department.label}
                        </span>
                      );
                    })}
                  {filterOptions?.programmes &&
                    filterOptions.programmes.map((program) => {
                      return (
                        <span key={program.value} className="badge ms-1 bg-warning ms-1">
                          {program.label}
                        </span>
                      );
                    })}

                  {filterOptions && filterOptions.start_date && filterOptions.end_date ? (
                    <span className="ms-1 badge bg-success">{`${filterOptions.start_date} to ${filterOptions.end_date}`}</span>
                  ) : filterOptions?.start_date ? (
                    <span className="ms-1 badge bg-success">{`From ${filterOptions.start_date}`}</span>
                  ) : filterOptions?.end_date ? (
                    <span className="ms-1 badge bg-success">{`From ${filterOptions.end_date}`}</span>
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

            <div className=" table-responsive rounded-2">
              {loading ? (
                <MiniLoader />
              ) : (
                <table className="table table-bordered w-100">
                  <thead className="table-dark">
                    <tr className="">
                      <th>Attendance Number</th>

                      {workingDays.map((day) => {
                        return (
                          <th
                            style={{
                              whiteSpace: "nowrap",
                              width: "200px",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              border: "1px solid #ddd",
                              padding: "8px",
                            }}
                          >
                            {day}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {matchingTrainees.map((trainee: any) => (
                      <tr key={`${trainee.trainee_id}`}>
                        <td>{trainee.ATT_NO}</td>
                        {trainee.attendences.map((attendence: any) => (
                          <FlipableTableCell
                            onTime={attendence.on_time}
                            offTime={attendence.off_time}
                            status={attendence.status}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Modal to display schedule */}
            {/* <Modal show={show} onHide={handleClose}>
              <Modal.Header closeButton>
                <Modal.Title>Schedule for {selectedSchedule?.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedSchedule ? (
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Department</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSchedule.schedules.map((schedule, index) => (
                        <tr key={index}>
                          <td>{schedule.name}</td>
                          <td>{formatDate(schedule.start_date)}</td>
                          <td>{formatDate(schedule.end_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No schedule available.</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal> */}
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
                  <div>
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
                  </div>

                  <div className="mt-2 mb-2">
                    <div className="fw-semibold  d-flex">
                      <div>Filter by Time periods</div>
                    </div>

                    <div className="ps-1 mt-1 container">
                      <div className="row">
                        <div className="fw-light col-2">From</div>
                        <div className="ms-2 col">
                          <input
                            type="date"
                            {...register("start_date")}
                            className="form-control form-control-sm"
                          />
                        </div>
                      </div>
                      <div className="row mt-2">
                        <div className="fw-light col-2">To</div>
                        <div className="ms-2 col">
                          <input
                            type="date"
                            {...register("end_date")}
                            className="form-control form-control-sm"
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
                      start_date: null,
                      end_date: null,
                    });
                    setFilterOptions(null);
                    setFilterVisible(false);
                  }}
                >
                  Reset
                </button>
              </Modal.Footer>
            </Modal>
          </section>
        </div>
      )}
    </>
  );
}
