import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Base from "./Pages/Base.tsx";
import TraineeDetailsAddPage from "./Pages/TraineeDetailsAddPage.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ViewTraineesPage from "./Pages/ViewTraineesPage.tsx";

import { SessionProvider } from "./contexts/SessionContext.tsx";
import {
  newTraineesInsertPageLoader,
  traineeAddSchedulePageLoader,
  traineeBankDetailsLoader,
  traineesInsertFormPageLoader,
  viewTraineesPageLoader,
} from "./loaders/TraineesLoader.ts";

import { updatePageLoader } from "./loaders/UpdatePageLoader.ts";
import LandingPage from "./Components/LandingPage.tsx";
import TraineeDetailsAddPageV2 from "./Pages/TraineeDetailsAddPageV2.tsx";
import TraineeAddSchedulePage from "./Pages/TraineeAddSchedulePage.tsx";
import UploadAttendenceSheet from "./Pages/UploadAttendenceSheet.tsx";
import CalenderPage from "./Pages/CalenderPage.tsx";
import { holidaysLoader } from "./loaders/HolidaysLoader.ts";
import AttendencesPage from "./Pages/AttendencesPage.tsx";
import { viewAttendenceLoader } from "./loaders/AttendenceLoader.ts";
import { profilePageLoader } from "./loaders/ProfilePageLoader.ts";
import ProfilePage from "./Pages/ProfilePage.tsx";
import TraineeAddBankDetailsPage from "./Pages/TraineeAddBankDetailsPage.tsx";
import LoginPage from "./Pages/LoginPage.tsx";
import ErrorHandler from "./Components/ErrorHandler.tsx";
import TraineeBankDetailsUpdatePage from "./Pages/TraineeBankDetailsUpdatePage.tsx";
import TraineeDetailsUpdatePage from "./Pages/Admin/TraineeDetailsUpdate.tsx";
import UserProfilePage from "./Pages/UserProfilePage.tsx";
import {
  createUserLoader,
  profileLoader,
  viewUsersPageLoader,
} from "./loaders/UserLoaders.ts";
import {
  departmentSummaryLoader,
  singleDepartmentLoader,
} from "./loaders/DepartmentLoader.ts";
import DepartmentsPage from "./Pages/DepartmentsPage.tsx";
import DepartmentPage from "./Pages/DepartmentPage.tsx";
import api from "./api.ts";
import AddUsersPage from "./Pages/Admin/AddUserPage.tsx";
import ViewUsersPage from "./Pages/Admin/ViewUsersPage.tsx";
import { inboxLoader } from "./loaders/inboxLoader.ts";
import GeneratePaymentSlip from "./Pages/GeneratePaymentSlip.tsx";
import {
  PaymentSlipLoader,
  paymentDetailsLoader,
} from "./loaders/PaymentSlipLoader.ts";
import NewInterviewPage from "./features/Interview/interviewPage.tsx";
import ViewInterviewPage from "./features/Interview/viewInterviewPage.tsx";
import EditInterviewPage from "./features/Interview/editInterviewPage.tsx";
import { InterviewLoader } from "./loaders/InterviewLoader.ts";
import { traineeDetailsPageLoader } from "./loaders/TraineesLoader.ts";
import PaymentsPage from "./Pages/PaymentsPage.tsx";
import ViewPaymentDetails from "./Pages/ViewPaymentDetails.tsx";
import TraineeDetailsPage from "./Pages/TraineeDetailsPage.tsx";
import UserUpdatePage from "./Pages/Admin/UserUpdatePage.tsx";
import NotificationPage from "./Pages/NotificationPage.tsx";

export const setToken = () => {
  const token = localStorage.getItem("token");
  console.log(token);
  if (token) {
    api.defaults.headers.common.Authorization = token;
  } else {
    console.log("no token to set");
  }
};

setToken();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <LandingPage />,
    children: [
      {
        index: true, // This handles the exact "/" path
        element: <Navigate to="/OJT/trainees" replace />,
      },
      {
        path: "OJT",
        element: <Base />,
        errorElement: <ErrorHandler />,
        children: [
          {
            index: true, // This handles "/OJT" without trailing path
            element: <Navigate to="trainees" replace />,
          },
          {
            path: "inbox",
            loader: inboxLoader,
            element: (
              <>
                <div>inbox page</div>
              </>
            ),
          },
          {
            path: "interview/new",
            element: <NewInterviewPage />,
          },
          {
            path: "interview",
            element: <ViewInterviewPage />,
            loader: InterviewLoader,
          },
          {
            path: "interview/:NIC/edit",
            element: <EditInterviewPage />,
            loader: InterviewLoader,
          },
          {
            path: "user_profile",
            element: <UserProfilePage />,
            loader: profileLoader,
          },
          {
            path: "trainees",
            loader: viewTraineesPageLoader,
            element: <ViewTraineesPage />,
          },
          {
            path: "add_old_records",
            loader: traineesInsertFormPageLoader,
            element: <TraineeDetailsAddPage />,
          },
          {
            path: "trainees/new",
            element: <TraineeDetailsAddPageV2 />,
            loader: newTraineesInsertPageLoader,
          },
          {
            path: "trainees/:id/add_schedules",
            element: <TraineeAddSchedulePage />,
            loader: traineeAddSchedulePageLoader,
          },
          {
            path: "trainees/details",
            element: <TraineeDetailsPage />,
            loader: traineeDetailsPageLoader,
          },
          {
            path: "attendence/new",
            element: <UploadAttendenceSheet />,
          },
          {
            path: "attendence",
            element: <AttendencesPage />,
            loader: viewAttendenceLoader,
          },
          {
            path: "payments",
            element: <PaymentsPage />,
            loader: paymentDetailsLoader,
          },
          {
            path: "payments/paymentslipgenerate",
            element: <GeneratePaymentSlip />,
            loader: PaymentSlipLoader,
          },
          {
            path: "payments/:id/view",
            element: <ViewPaymentDetails />,
          },
          {
            path: "calender",
            loader: holidaysLoader,
            element: <CalenderPage />,
          },
          {
            path: "trainees/:id/profile",
            loader: profilePageLoader,
            element: <ProfilePage />,
          },
          {
            path: "trainees/:id/update",
            loader: updatePageLoader,
            element: <TraineeDetailsUpdatePage />,
          },
          {
            path: "trainees/:id/bank_details",
            loader: traineeBankDetailsLoader,
            element: <TraineeAddBankDetailsPage />,
          },
          {
            path: "trainees/:id/bank_details/update",
            loader: traineeBankDetailsLoader,
            element: <TraineeBankDetailsUpdatePage />,
          },
          {
            path: "departments",
            loader: departmentSummaryLoader,
            element: <DepartmentsPage />,
          },
          {
            path: "departments/:id",
            loader: singleDepartmentLoader,
            element: <DepartmentPage />,
          },
          {
            path: "users/create",
            loader: createUserLoader,
            element: <AddUsersPage />,
          },
          {
            path: "users",
            loader: viewUsersPageLoader,
            element: <ViewUsersPage />,
          },
          {
            path: "users/:id/update",
            element: <UserUpdatePage />,
          },
          {
            path: "notifications",
            element: <NotificationPage />,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <SessionProvider>
    <RouterProvider router={router} />
  </SessionProvider>
);
