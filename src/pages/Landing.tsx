import { Link } from "react-router-dom";
import { Mark3D } from "@/components/mark";

export default function Landing() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Mark3D size={140} />
      <Link to="/demo">Demo</Link>
    </div>
  );
}
