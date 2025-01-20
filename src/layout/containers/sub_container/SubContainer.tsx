import { ReactNode } from "react";
interface Props {
  children: ReactNode;
}
export default function SubContainer({ children }: Props) {
  return (
    <div
      className="  p-1 m-1 border border-dark-subtle border-2 rounded-2 bg-body-tertiary px-2"
      style={{
        backgroundColor: "#fff",
        flex: 1,
        minHeight: "75vh",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}
