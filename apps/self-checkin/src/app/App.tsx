import { RouterProvider } from "react-router";
import { router } from "./router/router";
import Providers from "./providers";

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
