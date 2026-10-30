import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/style.css";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import { CatalogProvider } from "./context/CatalogContext";
import { CustomerProvider } from "./context/CustomerContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogProvider>
        <CustomerProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </CustomerProvider>
      </CatalogProvider>
    </BrowserRouter>
  </StrictMode>,
);
