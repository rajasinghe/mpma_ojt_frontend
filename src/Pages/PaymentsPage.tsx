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
import { Accordion } from 'react-bootstrap';
import "./GeneratePaymentSlip.css";

interface Trainee {
  trainee_id: number;
  trainee_attNO: number;
  REG_NO: string;
  endDate: string;
  name: string;
  AttCount: number;
  payment: number;
}

interface loaderProps {
  selectTrainees: Trainee[];
  summary: any[];
  traineesWIthoutBankDetails: number[];
  allGOVTrainees: any[];
  meanPayment: number;
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
  const [trainees, setTrainees] = useState<Trainee[]>(loaderData.selectTrainees);
  const [traineesInmodel, setTraineesInModel] = useState<Trainee[]>(loaderData.selectTrainees);
  const [matchingTrainees, setMatchingTrainees] = useState<any>(loaderData.selectTrainees);
  //const [trainee_id, setTraineeId] = useState<null | number>(null);
  const [keyword, setKeyword] = useState<string>("");
  const [paymentSummary, setPaymentSummary] = useState<number[]>(loaderData.traineesWIthoutBankDetails);
  const [otherTrainees, setOtherTrainees] = useState<any[]>(loaderData.allGOVTrainees);
  const [showModel, setShowModel] = useState<boolean>(false);

  const [removedTrainees, setRemovedTrainees] = useState<any[]>([]);
  const [payAmountperDay, setPayAmount] = useState<number>(loaderData.meanPayment);
  const [prePayAmount, setprePayAmount] = useState<number>(loaderData.meanPayment);
  

  //const [show, setShow] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);

  const [filterOptions, setFilterOptions] = useState<filterFormValues | null>(null);
  const [resultCount, setResultCount] = useState<number>(loaderData.selectTrainees.length);
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
            const [ paymentSummary] = await Promise.all([
              api.get("api/payments/generatePaySlip/summary", {
                params: {
                  month: filterParams.month,
                  year: filterParams.year,
                },
              }),
            ]);

            setPaymentSummary(paymentSummary.data.traineesWithoutBankDetails); 

            setTrainees(paymentSummary.data.selectTrainees);
            setTraineesInModel(paymentSummary.data.selectTrainees);
            setPayAmount(paymentSummary.data.meanPayment);
            setprePayAmount(paymentSummary.data.meanPayment);

            const other = getUniqueGOVTrainees(paymentSummary.data.selectTrainees,paymentSummary.data.allGOVTrainees);

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

  const refreshData = async () => {
    try {
      setLoading(true);
      const [paymentSummary] = await Promise.all([
        api.get("api/payments/generatePaySlip/summary", {
          params: {
            month: filterOptions?.month?.value,
            year: filterOptions?.year?.value,
          },
        }),
      ]);

      setPaymentSummary(paymentSummary.data.traineesWithoutBankDetails);
      
      setTrainees(paymentSummary.data.selectTrainees);
      setTraineesInModel(paymentSummary.data.selectTrainees);
      setPayAmount(paymentSummary.data.meanPayment);
      setprePayAmount(paymentSummary.data.meanPayment);

      const other = getUniqueGOVTrainees(paymentSummary.data.selectTrainees,paymentSummary.data.allGOVTrainees);
      setOtherTrainees(other);

    } catch (error) {
      console.error("Error refreshing data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to refresh data',
        text: 'Please try again later'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (traineeId: number) => {
    try {
      const response = await api.post("api/payments/removeFromPaymentList", {
        year: Number(filterOptions?.year?.value),
        month: Number(filterOptions?.month?.value),
        id: traineeId
      });

      if (response.status === 200) {
        // Update the trainees list by filtering out the removed trainee
        refreshData();
      }
    } catch (error) {
      console.log(error);
      // Show error message to user
      Swal.fire({
        icon: 'error',
        title: 'Failed to remove trainee',
        text: 'Please try again later'
      });
    }
  };

  const handleAdd = async (traineeId: number) => {
    try {
      const response = await api.post("api/payments/addToPaymentList", {
        year: Number(filterOptions?.year?.value),
        month: Number(filterOptions?.month?.value),
        id: traineeId
      });

      if (response.status === 200) {
        // Find the trainee being added
        const addedTrainee = otherTrainees.find(t => t.trainee_id === traineeId);
        
        if (addedTrainee) {
          // Remove from otherTrainees
          setOtherTrainees(prev => 
            prev.filter(trainee => trainee.trainee_id !== traineeId)
          );

          // Add to main trainees list
          setTrainees(prev => [...prev, addedTrainee]);

          // Update payment summary
          setPaymentSummary(prev => [...prev, Number(addedTrainee.ATT_NO)]);

        }
        refreshData();
      }
    } catch (error) {
      console.log(error);
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Failed to add trainee',
        text: 'Please try again later'
      });
    }
  };


  const getUniqueGOVTrainees = (selectedTraineeIds: any[], allGOVTrainees: any[]) => {
    // Filter GOV trainees that are not in the selected trainees array
    return allGOVTrainees.filter((govTrainee) => 
      !selectedTraineeIds.map((data: { trainee_id: number; }) => data.trainee_id)
        .includes(govTrainee.trainee_id)
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
                  placeholder="Search..."
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
            <div className="border border-2 rounded-2 p-1 mx-auto" style={{ maxHeight: "53vh", overflowY: "auto", maxWidth: "1200px"}}>
                <Accordion defaultActiveKey={["0"]} alwaysOpen>
                  {/* Payment List */}
                  <Accordion.Item eventKey="0">
                    <Accordion.Header style={{ position: 'sticky', top: 0, zIndex: 3, backgroundColor: '#fff' }}>Payment List</Accordion.Header>
                    <Accordion.Body>
                      <div className="table-responsive rounded shadow-sm p-1 bg-white">
                        {loading ? (
                          <MiniLoader />
                        ) : (
                          <table className="table table-hover table-bordered table-striped align-middle text-center">
                            <thead className="table-dark sticky-top small" style={{position:'sticky',top:0,zIndex:2, backgroundColor: '#212529'}}>
                              <tr className="small">
                                <th className="bg-dark text-white">NO</th>
                                <th className="bg-dark text-white">ATT_NO</th>
                                <th className="bg-dark text-white">REG NO</th>
                                <th className="bg-dark text-white">END DATE</th>
                                <th className="bg-dark text-white">NAME</th>
                                <th className="bg-dark text-white">ATTN COUNT</th>
                                <th className="bg-dark text-white">PAYMENT</th>
                                <th className="bg-dark text-white">Options</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matchingTrainees.map((trainee:any, index:number) => {

                                return (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{trainee.trainee_attNO || ''}</td>
                                    <td>{trainee.REG_NO || ''}</td>
                                    <td>{trainee.endDate?.split('T')[0] || ''}</td>
                                    <td>{trainee.name || ''}</td>
                                    <td>{trainee.AttCount}</td>
                                    <td>RS. {trainee.payment}</td>
                                    <td>
                                      <div className="d-flex gap-2 justify-content-center">
                                      <Link
                                        to={`/OJT/payments/${trainee.trainee_id}/view`}
                                        className={`btn btn-sm d-flex align-items-center justify-content-center px-2 py-1 ${paymentSummary.includes(Number(trainee.trainee_attNO)) ? 'btn-primary' : 'btn-outline-warning'}`}
                                        title={paymentSummary.includes(Number(trainee.trainee_attNO)) ? 'Add details' : 'View details'}
                                      >
                                        <i className={`bi ${paymentSummary.includes(Number(trainee.trainee_attNO)) ? 'bi-plus-circle' : 'bi bi-file-earmark-text'}`}></i>
                                      </Link>
                                      {paymentSummary.includes(Number(trainee.trainee_attNO)) && (
                                        <button
                                          onClick={() => handleRemove(trainee.trainee_id)}
                                          className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center px-2 py-1"
                                          title="Remove from list"
                                        >
                                          <i className="bi bi-x-circle"></i>
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
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <Accordion defaultActiveKey={["1"]} alwaysOpen>
                  {/* Other Trainees */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header style={{position:'sticky',top:0,zIndex:3, backgroundColor: '#fff'}}>Others</Accordion.Header>
                    <Accordion.Body>
                      <div className="table-responsive rounded shadow-sm p-1 bg-white">
                        {loading ? (
                          <MiniLoader />
                        ) : (
                          <table className="table table-hover table-bordered table-striped align-middle text-center">
                            <thead className="table-dark sticky-top small" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                              <tr className="small">
                                <th className="bg-dark text-white">NO</th>
                                <th className="bg-dark text-white">ATT_NO</th>
                                <th className="bg-dark text-white">REG NO</th>
                                <th className="bg-dark text-white">END DATE</th>
                                <th className="bg-dark text-white">NAME</th>
                                <th className="bg-dark text-white">ATTN COUNT</th>
                                <th className="bg-dark text-white">Options</th>
                              </tr>
                            </thead>
                            <tbody>
                              {otherTrainees.map((trainee, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{trainee.AttNo || ''}</td>
                                  <td>{trainee.REG_NO || ''}</td>
                                  <td>{trainee.endDate?.split('T')[0] || ''}</td>
                                  <td>{trainee.name || ''}</td>
                                  <td>{trainee.AttCount || 0}</td>
                                  <td>
                                    <div className="d-flex gap-2 justify-content-center">
                                    {/* View/Add Link Button */}
                                    <Link
                                      to={`/OJT/payments/${trainee.trainee_id}/view`}
                                      className={`btn btn-sm d-flex align-items-center justify-content-center px-2 py-1 ${paymentSummary.includes(Number(trainee.AttNo)) ? 'btn-primary' : 'btn-outline-warning'}`}
                                      title={paymentSummary.includes(Number(trainee.AttNo)) ? 'Add details' : 'View trainee'}
                                    >
                                      <i className={`bi ${paymentSummary.includes(Number(trainee.AttNo)) ? 'bi-plus-circle' : 'bi bi-file-earmark-text'}`}></i>
                                    </Link>

                                    {/* Add Button (only if not already in paymentSummary) */}
                                    {!paymentSummary.includes(Number(trainee.AttNo)) && (
                                      <button
                                        onClick={() => handleAdd(trainee.trainee_id)}
                                        className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center px-2 py-1"
                                        title="Add to payment list"
                                      >
                                        <i className="bi bi-arrow-bar-up"></i>
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
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>

            <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
              <div>
                <button
                  type="button"
                  className="btn btn-success btn-sm ms-2"
                  onClick={handleDownload}
                >
                  Download Payment Records
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setShowModel(true);}}
                  disabled={loading}
                >
                  Change list
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

            {/*Payment list Change*/}
            <Modal
              show={showModel}
              onHide={() => {
                setShowModel(false);
                setRemovedTrainees([]);
                refreshData();
              }}
              backdrop="static"
              dialogClassName="min-width-modal"
            >
              <Modal.Header closeButton>
                <div className=" fw-bold  w-100 ">Change Payment List</div>
              </Modal.Header>
                <Modal.Body>
                <form className="d-flex flex-column gap-2">
                  <div className="form-group">
                  <label htmlFor="amount" className="form-label">Amount per day</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    placeholder="Enter amount per day"
                    value={payAmountperDay}
                    onChange={e => {setPayAmount(Number(e.target.value));
                    }}
                  />
                  </div>
                </form>
                {/* Add space between form and table */}
                <div style={{ height: "16px" }} />
                <div className="border border-2 rounded-2 p-1 mx-auto shadow-sm bg-white" style={{ maxHeight: "53vh", overflowY: "auto" }}>
                  <table className="table table-hover table-bordered table-striped align-middle text-center">
                  <thead className="table-dark sticky-top small" style={{position:'sticky',top:0,zIndex:2, backgroundColor: '#212529'}}>
                    <tr className="small">
                    <th className="bg-dark text-white">NO</th>
                    <th className="bg-dark text-white">ATT_NO</th>
                    <th className="bg-dark text-white">NAME</th>
                    <th className="bg-dark text-white">ATTN COUNT</th>
                    <th className="bg-dark text-white">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traineesInmodel.map((trainee:any, index:number) => {
                    return (
                      <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{trainee.trainee_attNO || ''}</td>
                      <td>{trainee.name || ''}</td>
                      <td>{trainee.AttCount}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                        <button
                          onClick={() => {
                            const removedTrainee = trainees.find(t => t.trainee_id === trainee.trainee_id);
                            if (removedTrainee) {
                              setRemovedTrainees(prev => [...prev, removedTrainee]); 
                            }
                            
                            setTraineesInModel(prevTrainees => 
                              prevTrainees.filter(t => t.trainee_id !== trainee.trainee_id)
                            );
                          }}
                          className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center px-2 py-1"
                          title="Remove from list"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                        </div>
                      </td>
                      </tr>
                    );
                    })}
                  </tbody>
                  </table>
                </div>
                </Modal.Body>
              <Modal.Footer>
              <button
                className=" ms-auto btn btn-sm  btn-success"
                onClick={async () => {
                    // Check if there are no removed trainees and pay amount per day hasn't changed
                    if (
                    removedTrainees.length === 0 &&
                    payAmountperDay === prePayAmount
                    ) {
                    Swal.fire({
                      icon: "info",
                      title: "No changes",
                      text: "No changes were happened.",
                    });
                    return;
                    }
                    const confirmResult = await Swal.fire({
                      title: "Are you sure?",
                      text: "Do you want to save these changes?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Yes, save it!",
                      cancelButtonText: "Cancel"
                    });
                    if (!confirmResult.isConfirmed) {
                      setLoading(false);
                      return;
                    }
                  try {
                    setLoading(true);
                    const requests = [];

                    if (removedTrainees.length > 0){
                      requests.push(...removedTrainees.map(trainee =>
                        api.post("api/payments/removeFromPaymentList", {
                          year: Number(filterOptions?.year?.value),
                          month: Number(filterOptions?.month?.value),
                          id: trainee.trainee_id
                        })
                      ));
                    }
                    
                    if (payAmountperDay !== prePayAmount) {
                      requests.push(
                        api.post("api/payments/updatePaymentPerDay", {
                          year: Number(filterOptions?.year?.value),
                          month: Number(filterOptions?.month?.value),
                          newAmount: payAmountperDay,
                        })
                      );
                    }

                    await Promise.all(requests);

                    Swal.fire({
                      icon: "success",
                      title: "Saved",
                      text: "Payment list updated.",
                    });
                    setRemovedTrainees([]);
                    setShowModel(false);
                    refreshData();
                  } catch (error) {
                    Swal.fire({
                      icon: "error",
                      title: "Failed",
                      text: "Could not update payment list.",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Save
              </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setShowModel(false);
                    setRemovedTrainees([]);
                    refreshData();
                  }}>
                  Close
                </button>
              </Modal.Footer>
            </Modal>
          </SubContainer>
        </MainContainer>
      )}
    </>
  );
}

