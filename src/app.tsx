import LigoHeader from "./components/LigoHeader";
import Vehicles from "./components/Vehicles";
import Browse from "./components/Browse";
import Rentals from "./components/Rentals";
import { useLocation } from "react-router-dom";

export default function App() {
  const { hash } = useLocation();

  return (
    <>
      <LigoHeader />
      {hash === "#browse" ? (
        <Browse />
      ) : hash === "#rentals" ? (
        <Rentals />
      ) : (
        <Vehicles />
      )}
    </>
  );
}
