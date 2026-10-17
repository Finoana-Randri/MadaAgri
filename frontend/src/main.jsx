import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { StoreProvider } from "./store.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Recover from "./pages/Recover.jsx";
import Verify from "./pages/Verify.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import { Delivery, Payment } from "./pages/Checkout.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Tracking from "./pages/Tracking.jsx";
import Orders from "./pages/Orders.jsx";
import Producer from "./pages/Producer.jsx";
import Admin from "./pages/Admin.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminCatalog from "./pages/AdminCatalog.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import NotFound from "./pages/NotFound.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="connexion" element={<Login />} />
            <Route path="inscription" element={<Register />} />
            <Route path="mot-de-passe" element={<Recover />} />
            <Route path="verification" element={<Verify />} />
            <Route path="produit/:id" element={<Product />} />
            <Route path="panier" element={<Cart />} />
            <Route path="livraison" element={<Delivery />} />
            <Route path="paiement" element={<Payment />} />
            <Route path="confirmation/:id" element={<Confirmation />} />
            <Route path="commandes" element={<Orders />} />
            <Route path="commandes/:id" element={<Tracking />} />
            <Route path="producteur" element={<Producer />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/commandes" element={<AdminOrders />} />
            <Route path="admin/catalogue" element={<AdminCatalog />} />
            <Route path="admin/parametres" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
