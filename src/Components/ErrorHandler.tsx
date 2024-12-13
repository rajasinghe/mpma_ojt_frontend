import { useRouteError } from "react-router-dom";

export default function ErrorHandler() {
  const error = useRouteError() as any;
  return <div>{error.message}</div>;
}
