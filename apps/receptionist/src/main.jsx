import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
import "./index.css";

window.addEventListener("hotelos:unauthorized", () => {
  window.location.href = "/login";
});

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
