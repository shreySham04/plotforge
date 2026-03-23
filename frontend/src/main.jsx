import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const savedTheme = localStorage.getItem("writerapp_theme") || "dark";
document.documentElement.classList.remove("theme-light", "theme-dark");
document.documentElement.classList.add(savedTheme === "light" ? "theme-light" : "theme-dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
