import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router.jsx";
import { AppProviders } from "./providers.jsx";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
