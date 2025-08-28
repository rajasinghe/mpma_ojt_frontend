import { Link, useLoaderData, useNavigation } from "react-router-dom";
import { Trainee } from "../Components/traineeForm/Trainee";
import { useEffect, useState } from "react";
import { formatDate } from "../helpers";
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
import { Modal } from "react-bootstrap";
import { utils, writeFileXLSX } from "xlsx";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import SubContainer from "../layout/containers/sub_container/SubContainer";

interface loaderProps {
  trainees: Trainee[];
  departments: any[];
  programmes: any[];
  institutes: any[];
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
  includeInactiveTrainees: z.boolean(),
});

type filterFormValues = z.infer<typeof filterSchema>;

export default function ViewTraineesPage() {
  const loaderData = useLoaderData() as loaderProps;
  const [trainees, setTrainees] = useState<Trainee[]>(loaderData.trainees);
  const [matchingTrainees, setMatchingTrainees] = useState<Trainee[]>(
    loaderData.trainees
  );
  const [keyword, setKeyword] = useState<string>("");

  const [filterVisible, setFilterVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState<filterFormValues | null>(
    null
  );
  const [resultCount, setResultCount] = useState<number>(
    loaderData.trainees.length
  );
  const [searchCount, setSearchCount] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [activeTrainees, setActiveTrainees] = useState<Trainee[]>(
    loaderData.trainees
  );

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

  const getAllData = async () => {
    //fetch all the records available
    //set the loading state
    setLoading(true);
    const data = await api.get("/api/trainee");
    console.log(data);
    setLoading(false);
    setTrainees(data.data);
    setActiveTrainees(data.data);

    //remove the loading state and display the data
  };

  useEffect(() => {
    if (filterOptions == null) {
      //fetch all the records available
      getAllData();
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
          includeInactiveTrainees: filterOptions.includeInactiveTrainees,
        };

        console.log(filter);

        const getFilteredData = async (filterParams: any) => {
          //set loading state
          console.log(filterParams);
          setLoading(true);
          const data = await api.get("/api/trainee/filter_data", {
            params: filterParams,
          });
          console.log(data);
          setLoading(false);
          setTrainees(data.data);
        };

        getFilteredData(filter);
      } catch (error) {
        console.log(error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
    }
  }, [filterOptions]);

  useEffect(() => {
    console.log(matchingTrainees);
  }, []);

  const handleDownload = async () => {
    try {
      console.log(matchingTrainees);
      const headers = [
        "ATT_NO",
        "REG_NO",
        "Name",
        "NIC_NO",
        "Institute",
        "program",
        "TEL_NO",
        "Training Period",
        "Start Date",
        "End Date",
      ];
      const dataRows = matchingTrainees.map((trainee) => {
        return [
          trainee.ATT_NO,
          trainee.REG_NO,
          trainee.name,
          trainee.NIC_NO,
          trainee.institute,
          trainee.program,
          trainee.contact_no,
          trainee.training_period,
          formatDate(trainee.start_date),
          formatDate(trainee.end_date),
        ];
      });
      console.log(dataRows[0]);
      const rows = [headers, ...dataRows];
      const book = utils.book_new();

      const sheet = utils.aoa_to_sheet(rows);
      utils.book_append_sheet(book, sheet, "Register");
      writeFileXLSX(book, "register.xlsx", { bookType: "xlsx" });
    } catch (error) {
      console.log(error);
    }
  };

  const hasCurrentDepartment = (trainee: Trainee) => {
    if (!activeTrainees.some((t: Trainee) => t.id === trainee.id)) {
      return true; // Not consider inactive trainees
    }

    if (!trainee.schedules?.length) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison

    return trainee.schedules.some((schedule) => {
      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);
      return today >= startDate && today <= endDate;
    });
  };

  /* const handleClose = () => setShow(false); */

  // Function to handle showing the modal with the selected trainee's schedule or redirect to add schedules page
  /* const handleShow = (trainee: Trainee) => {
    if (trainee.schedules) {
      setSelectedSchedule(trainee); // Set the selected trainee
      setShow(true); // Show the modal
    } else {
      navigate(`${trainee.id}/add_schedules`);
    }
  }; */

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
      setSearchCount(0);
      setMatchingTrainees(trainees);
    }
  };

  const fuse = new Fuse(trainees, {
    keys: ["ATT_NO", "NIC_NO", "REG_NO", "name"],
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
      data.end_date ||
      data.includeInactiveTrainees == true
    ) {
      setFilterOptions(data);
      setFilterVisible(false);
    } else {
      setError("root", {
        message: "one of the filters must be used to filter data ",
      });
    }
    /*; */
  };

  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer title="Trainees" breadCrumbs={["Home", "Trainees"]}>
          <SubContainer>
            <div className="body">
              {/* header section */}
              <section className="px-2 mt-1 ">
                {/*search bar  */}
                <div className="d-flex flex-column">
                  <div className="bg-body-secondary p-2 mb-2 rounded-2 ">
                    {/* serach box */}
                    <div className="d-flex">
                      <input
                        className=" form-control "
                        type="text"
                        value={keyword}
                        onChange={(e) => {
                          setKeyword(e.target.value);
                          handleSearch(e.target.value);
                        }}
                      />
                      <button
                        onClick={() => {
                          setFilterVisible(true);
                        }}
                        className="btn shadow ms-2 btn-outline-warning"
                      >
                        <img src={optionsIcon} height={"22px"} alt="" />
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
                        {filterOptions?.includeInactiveTrainees && (
                          <span
                            className="badge bg-danger ms-1"
                            style={{ fontSize: "8px" }}
                          >
                            Inactive Trainees
                          </span>
                        )}
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

                        {filterOptions &&
                        filterOptions.start_date &&
                        filterOptions.end_date ? (
                          <span
                            className="badge bg-primary ms-1"
                            style={{ fontSize: "8px" }}
                          >{`${filterOptions.start_date} to ${filterOptions.end_date}`}</span>
                        ) : filterOptions?.start_date ? (
                          <span
                            className="badge bg-primary ms-1"
                            style={{ fontSize: "8px" }}
                          >{`From ${filterOptions.start_date}`}</span>
                        ) : filterOptions?.end_date ? (
                          <span
                            className="badge bg-primary ms-1"
                            style={{ fontSize: "8px" }}
                          >{`To ${filterOptions.end_date}`}</span>
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

                  <div
                    className="border border-2 rounded-2 p-1"
                    style={{
                      flex: 1,
                    }}
                  >
                    <div className=" table-responsive rounded-2  table-scrollbar">
                      {loading ? (
                        <MiniLoader />
                      ) : (
                        <table className="table table-sm table-bordered w-100">
                          <thead className="table-dark position-sticky top-0">
                            <tr className="small" style={{ fontSize: "" }}>
                              <th scope="col">ATT No.</th>
                              <th>Reg No.</th>
                              <th scope="col">Name</th>
                              <th scope="col">NIC Number</th>
                              <th>Institute</th>
                              <th>Programme</th>

                              <th>Options</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchingTrainees.map((trainee: Trainee) => (
                              <tr key={`${trainee.NIC_NO}-${trainee.REG_NO}`}>
                                <td>{trainee.ATT_NO}</td>
                                <td>{trainee.REG_NO}</td>
                                <td>{trainee.name}</td>
                                <td>{trainee.NIC_NO}</td>
                                <td>{trainee.institute}</td>
                                <td>{trainee.program}</td>
                                <td>
                                  <div>
                                    <Link
                                      className={`btn btn-sm ${
                                        !hasCurrentDepartment(trainee)
                                          ? "btn-primary"
                                          : "btn-warning"
                                      }`}
                                      to={`${trainee.id}/profile`}
                                      style={{ width: "57px" }}
                                    >
                                      {!hasCurrentDepartment(trainee)
                                        ? "Add"
                                        : "Profile"}
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div
                    className=" d-flex mt-2"
                    style={{
                      height: "4vh",
                    }}
                  >
                    <Link
                      to={"/OJT/trainees/new"}
                      className="btn btn-primary btn-sm ms-auto"
                    >
                      Add New Trainee
                    </Link>
                    <button
                      className="btn btn-success btn-sm ms-2"
                      onClick={handleDownload}
                    >
                      Download Records
                    </button>
                  </div>
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
                      {errors.root && (
                        <p className="text-danger m-0">{errors.root.message}</p>
                      )}
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
                                  options={loaderData.programmes.map(
                                    (programme) => ({
                                      value: programme.id,
                                      label: programme.name,
                                    })
                                  )}
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
                                  options={loaderData.institutes.map(
                                    (institute) => ({
                                      value: institute.id,
                                      label: institute.name,
                                    })
                                  )}
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
                                  options={loaderData.departments.map(
                                    (department) => ({
                                      value: department.id,
                                      label: department.name,
                                    })
                                  )}
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

                      <div>
                        <div className="d-flex">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register("includeInactiveTrainees")}
                          />
                          <div className="ms-2 fw-semibold">
                            Include Inactive Trainees
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
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}
