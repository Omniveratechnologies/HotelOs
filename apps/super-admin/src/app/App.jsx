import { RouterProvider } from "react-router";
import { router } from "./router.jsx";
import { AppProviders } from "./AppProviders.jsx";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
