import { ReactNode } from "react";
interface Props {
  children: ReactNode;
  maxWidth?: string;
  centered?: boolean;
}
export default function SubContainer({
  children,
  maxWidth = "1400px",
  centered = true,
}: Props) {
  return (
    <div
      className={`p-1 border border-dark-subtle border-2 rounded-2 bg-body-tertiary px-2 ${
        centered ? "mx-auto" : "m-1"
      }`}
      style={{
        backgroundColor: "#fff",
        flex: 1,
        minHeight: "75vh",
        overflowY: "auto",
        maxWidth: maxWidth,
        marginTop: "0.25rem",
        marginBottom: "0.25rem",
      }}
    >
      {children}
    </div>
  );
}
