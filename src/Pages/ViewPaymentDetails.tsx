import { Link, useNavigate, useNavigation, useParams } from "react-router-dom";
import Loader from "../Components/ui/Loader/Loader";
import { MainContainer } from "../layout/containers/main_container/MainContainer";
import { useEffect, useState } from "react";
import api from "../api";

interface TraineeData {
    id: number;
    name: string;
    ATT_NO: number;
    REG_NO: string;
    NIC_NO: string;
}

interface PaymentData {
    id: number;
    trainee_id: number;
    branch_code: number;
    acc_no: string;
    name: string;
}

interface CombinedData {
    name: string;
    ATT_NO: number;
    REG_NO: string;
    NIC_NO: string;
    branch_code: number;
    acc_no: string;
    bankName: string;
}

export default function TraineeBankDetailsUpdatePage() {
    const { state } = useNavigation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [trainee, setTrainee] = useState<CombinedData | null>(null);

    useEffect(() => {
        if (!id) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                // First get trainee data
                const traineeResponse = await api.get<TraineeData>(`api/trainee/${id}`);
                let paymentResponse = null;

                // Only try to get payment data if trainee exists
                if (traineeResponse.data) {
                    try {
                        paymentResponse = await api.get<PaymentData>(`api/payments/${id}`);
                    } catch (paymentError) {
                        console.log('No payment data found:', paymentError);
                        // Continue execution even if payment data fetch fails
                    }

                    const combinedData: CombinedData = {
                        name: traineeResponse.data.name,
                        ATT_NO: traineeResponse.data.ATT_NO,
                        REG_NO: traineeResponse.data.REG_NO,
                        NIC_NO: traineeResponse.data.NIC_NO,
                        // Set default values if payment data doesn't exist
                        branch_code: paymentResponse?.data?.branch_code || 0,
                        acc_no: paymentResponse?.data?.acc_no || '',
                        bankName: paymentResponse?.data?.name || ''
                    };
                    setTrainee(combinedData);
                }
            } catch (error) {
                console.error('Error fetching trainee data:', error);
            }
        };

        fetchData();
    }, [id, navigate]);


  return (
    <>
      {state == "loading" ? (
        <Loader />
      ) : (
        <MainContainer
          title="Bank Details"
          breadCrumbs={["Home", "Payments", "Bank Details"]}
        >
            <section className=" m-1 border border-dark-subtle border-2 rounded bg-body-tertiary px-2"
                style={{ minHeight: "50vh", maxWidth: "1200px"}}>
            <div className="container-fluid border border-dark rounded-2 my-2">
                <div className=" fs-5 fw-bolder">Trainee Details</div>
                <div className="">
                <div className=" fw-semibold">Reg NO - {trainee?.REG_NO}</div>
                <div className="fw-semibold">ATT NO - {trainee?.ATT_NO}</div>
                <div className="fw-semibold">NIC NO - {trainee?.NIC_NO}</div>
                </div>
            </div>
            <div className="container-fluid border border-dark rounded-2 my-2 py-2">
            <div className=" fs-5 fw-bolder">Bank Details</div>
            {trainee?.acc_no ? (
                <>
                <div className="  fw-semibold">Name - {trainee.bankName}</div>
                <div className="  fw-semibold">Account Number - {trainee.acc_no}</div>
                <div className="  fw-semibold">Branch Code - {trainee.branch_code}</div>
                <div>
                    <Link
                    to={`/OJT/trainees/${id}/bank_details/update`}
                    className="btn  btn-sm btn-warning"
                    >
                    update
                    </Link>
                </div>
                </>
            ) : (
                <Link
                to={`/OJT/trainees/${id}/bank_details`}
                className="btn btn-sm btn-primary"
                >
                Add Bank Details
                </Link>
            )}
            </div>
            </section>
        </MainContainer>
      )}
    </>
  );
}
