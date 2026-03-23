import { SpeedInsights } from "@vercel/speed-insights/react";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    <>
      <AppRouter />
      <SpeedInsights />
    </>
  );
}