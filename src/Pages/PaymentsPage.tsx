import { Link, useLoaderData, useNavigation } from "react-router-dom";
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


interface loaderProps {
  trainees: number[];
  workingDays: [];
  summary: [];
  traineesWIthoutBankDetails: number[];
  GOVTrainees: any[];
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
  const [matchingTrainees, setMatchingTrainees] = useState<any>(loaderData.trainees);
  //const [trainee_id, setTraineeId] = useState<null | number>(null);
  const [keyword, setKeyword] = useState<string>("");
  const [paymentSummary, setPaymentSummary] = useState<number[]>(loaderData.traineesWIthoutBankDetails);
  const [otherTrainees, setOtherTrainees] = useState<any[]>(loaderData.GOVTrainees);
  

  //const [show, setShow] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState<filterFormValues | null>(null);
  const [resultCount, setResultCount] = useState<number>(loaderData.trainees.length);
  const [searchCount, setSearchCount] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const today = new Date();
  const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

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
              api.get("api/payments/generatePaySlip/summary", {
                params: {
                  month: filterParams.month,
                  year: filterParams.year,
                },
              }),
            ]);
            console.log(workingDaysResponse.data);

            setPaymentSummary(selectedTrainee.data.traineesWithoutBankDetails);

            // Filter and sort trainees based on selectedTrainees order
            const filteredTrainees = selectedTrainee.data.traineeIds
              .map((id: number) => 
                attendencesResponse.data.find(
                  (trainee: { trainee_id: number }) => trainee.trainee_id === id
                )
              )
              .filter(Boolean);            

            setTrainees(filteredTrainees);

            const GOVTrainees = selectedTrainee.data.allGOVTrainees
            .map((govTrainee: { trainee_id: number, AttCount: number }) => {
              const traineeData = attendencesResponse.data.find(
                (trainee: { trainee_id: number }) => trainee.trainee_id === govTrainee.trainee_id
              );
              
              // Return combined data with AttCount
              return traineeData ? {
                ...traineeData,
                AttCount: govTrainee.AttCount
              } : null;
            })
            .filter(Boolean);

            const other = getUniqueGOVTrainees(selectedTrainee.data.traineeIds, GOVTrainees);

            setOtherTrainees(other);

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

  useEffect(() => {


  },[])

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

const handleDownload = async () => {
  try {
    const response = await api.post(
      "api/payments/downloadPaymentDetails",
      {
        params: {
          month: filterOptions?.month,
          year: filterOptions?.year,
          trainees: matchingTrainees.map((trainee: any) => trainee.trainee_id)
        }
      },
      {
        responseType: 'blob'
      }
    );
  
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
      : `Attendance_${filterOptions?.year?.value}_${filterOptions?.month?.value}.xlsx`;

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download',filename );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url); // Clean up the URL object

  } catch (error: any) {
    console.error("Error downloading payment records:", error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message || "An unexpected error occurred while downloading the payment records.",
      footer: '<a href="#">Why do I have this issue?</a>'
    });
  }
};

  const handleRemove = async (traineeId: number) => {

    try{
      console.log("remove:",traineeId);

      const response = await api.post("api/payments/removeFromPaymentList", {
        year: Number(filterOptions?.year?.value),
        month: Number(filterOptions?.month?.value),
        id: traineeId
      })

      console.log("response",response);
    } catch(error){
      console.log(error);
    }

  }

  const handleAdd = async (traineeId: number) => {

    try{
      console.log("Add:",traineeId);

      const response = await api.post("api/payments/addToPaymentList", {
        year: Number(filterOptions?.year?.value),
        month: Number(filterOptions?.month?.value),
        id: traineeId
      })

      console.log("response",response);
    } catch(error){
      console.log(error);
    }

  }


  const getUniqueGOVTrainees = (selectedTraineeIds: number[], allGOVTrainees: any[]) => {
    // Filter GOV trainees that are not in the selected trainees array
    return allGOVTrainees.filter((govTrainee) => 
      !selectedTraineeIds.includes(govTrainee.trainee_id)
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
                style={{ maxHeight: "53vh", overflow: "auto"}}
              >
                <h4>Payment List</h4>
                {loading ? (
                  <MiniLoader />
                ) : (
                  <table className="table table-sm table-bordered w-100">
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr className="small">
                      <th scope="col" className="bg-dark text-white">NO</th>
                      <th scope="col" className="bg-dark text-white">ATT_NO</th>
                      <th scope="col" className="bg-dark text-white">REG NO</th>
                      <th scope="col" className="bg-dark text-white">END DATE</th>
                      <th scope="col" className="bg-dark text-white">NAME</th>
                      <th scope="col" className="bg-dark text-white">ATTN TOTAL</th>
                      <th scope="col" className="bg-dark text-white">PAYMENT</th>
                      <th scope="col" className="bg-dark text-white">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingTrainees.map((trainee: any, index: number) => {
                      const attendanceTotal = trainee.attendences?.reduce(
                        (total: number, att: any) => total + (att.status === 1 ? 1 : 0),
                        0
                      ) || 0;
                      
                      const payAmount = attendanceTotal * 500;
                      
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{trainee.ATT_NO || ''}</td>
                          <td>{trainee.REG_NO || ''}</td>
                          <td>
                            {trainee.end_date 
                              ? trainee.end_date.split('T')[0] 
                              : ''}
                          </td>
                          <td>{trainee.name || ''}</td>
                          <td>{attendanceTotal}</td>
                          <td>RS. {payAmount.toLocaleString()}</td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                                <Link style={{ width: "80px" }}
                                to={`/OJT/payments/${trainee.trainee_id}/view`}
                                className={`btn btn-sm ${paymentSummary.includes(Number(trainee.ATT_NO)) ? 'btn-primary' : 'btn-warning'} sm-2`}
                                >
                                {paymentSummary.includes(Number(trainee.ATT_NO)) ? 'Add' : 'View'}
                                </Link>
                                {paymentSummary.includes(Number(trainee.ATT_NO)) && (
                                  <button
                                    onClick={() => handleRemove(trainee.trainee_id)}
                                    /*disabled={isRemoving}*/
                                    className="btn btn-sm btn-danger sm-2"
                                  >
                                    {/*isRemoving*/ 0 ? 'Removing...' : 'Remove'}
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}

                <h4>Other Trainees</h4>
                {loading ? (
                  <MiniLoader />
                ) : (
                  <table className="table table-sm table-bordered w-100">
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr className="small">
                        <th scope="col" className="bg-dark text-white">NO</th>
                        <th scope="col" className="bg-dark text-white">ATT_NO</th>
                        <th scope="col" className="bg-dark text-white">REG NO</th>
                        <th scope="col" className="bg-dark text-white">END DATE</th>
                        <th scope="col" className="bg-dark text-white">NAME</th>
                        <th scope="col" className="bg-dark text-white">ATTN COUNT</th>
                        <th scope="col" className="bg-dark text-white">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherTrainees.map((trainee: any, index: number) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{trainee.ATT_NO || ''}</td>
                          <td>{trainee.REG_NO || ''}</td>
                          <td>
                            {trainee.end_date 
                              ? trainee.end_date.split('T')[0] 
                              : ''}
                          </td>
                          <td>{trainee.name || ''}</td>
                          <td>{trainee.AttCount || 0}</td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <Link 
                                style={{ width: "80px" }}
                                to={`/OJT/payments/${trainee.trainee_id}/view`}
                                className={`btn btn-sm ${paymentSummary.includes(Number(trainee.ATT_NO)) ? 'btn-primary' : 'btn-warning'} sm-2`}
                              >
                                {paymentSummary.includes(Number(trainee.ATT_NO)) ? 'Add' : 'View'}
                              </Link>
                              {!paymentSummary.includes(Number(trainee.ATT_NO)) && (
                                <button
                                  onClick={() => handleAdd(trainee.trainee_id)}
                                  className="btn btn-sm btn-success sm-2"
                                >
                                  list
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    setFilterOptions({
                      month: { value: lastMonth.toString(), label: lastMonth.toString() },
                      year: { value: lastMonthYear.toString(), label: lastMonthYear.toString() }
                    });
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
