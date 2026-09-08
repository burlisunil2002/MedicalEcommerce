import { Routes, Route } from "react-router-dom";

// =====================================================
// CUSTOMER / PUBLIC PAGES
// =====================================================

import ProductList from "./pages/ProductList";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import KycRegister from "./pages/KycRegister";
import SearchResult from "./pages/SearchResult";
import ProductDetails from "./pages/ProductDetails";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ReviewPage from "./pages/ReviewPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import InvoicePage from "./pages/InvoicePage";
import OrderSuccessPage from "./pages/OrderSuccessPage";


// =====================================================
// ADMIN PAGES
// =====================================================

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProductManagement from "./pages/ProductManagement";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ReturnOrdersPage from "./pages/ReturnOrdersPage";
import SellerManagement from "./pages/SellerManagement";



// =====================================================
// SELLER PAGES
// =====================================================

import SellerLanding from "./pages/SellerLanding";
import SellerRegister from "./pages/SellerRegister";
import SellerLogin from "./pages/SellerLogin";
import SellerDashboard from "./pages/seller/SellerDashboard";
import Subscription from "./pages/seller/Subscription";
import SellerForgotPassword from "./pages/SellerForgotPassword";
import SellerResetPassword from "./pages/SellerResetPassword";


// =====================================================
// LAYOUTS
// =====================================================

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";


// =====================================================
// CONTEXT
// =====================================================

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";


// =====================================================
// TOASTER
// =====================================================

import { Toaster } from "react-hot-toast";


function App() {

    return (

        <CartProvider>

            <WishlistProvider>

                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 3000,

                        style: {
                            borderRadius: "10px",
                            background: "#1f2937",
                            color: "#fff"
                        },

                        success: {
                            iconTheme: {
                                primary: "#22c55e",
                                secondary: "#fff"
                            }
                        },

                        error: {
                            iconTheme: {
                                primary: "#ef4444",
                                secondary: "#fff"
                            }
                        }
                    }}
                />


                <Routes>


                    {/* =================================================
                        CUSTOMER WEBSITE
                    ================================================= */}

                    <Route
                        path="/"
                        element={<MainLayout />}
                    >

                        {/* HOME */}

                        <Route
                            index
                            element={<ProductList />}
                        />


                        {/* SEARCH */}

                        <Route
                            path="search/:term"
                            element={<SearchResult />}
                        />


                        {/* CATEGORY */}

                        <Route
                            path="category/:categoryName"
                            element={<ProductList />}
                        />


                        {/* PRODUCT DETAILS */}

                        <Route
                            path="product/:id"
                            element={<ProductDetails />}
                        />


                        {/* PROFILE */}

                        <Route
                            path="profile"
                            element={<Profile />}
                        />


                        {/* KYC */}

                        <Route
                            path="kyc/register"
                            element={<KycRegister />}
                        />


                        {/* CART */}

                        <Route
                            path="cart"
                            element={<CartPage />}
                        />


                        {/* CHECKOUT */}

                        <Route
                            path="checkout"
                            element={<CheckoutPage />}
                        />


                        {/* REVIEW */}

                        <Route
                            path="review"
                            element={<ReviewPage />}
                        />


                        {/* MY ORDERS */}

                        <Route
                            path="my-orders"
                            element={<MyOrdersPage />}
                        />


                        {/* INVOICE */}

                        <Route
                            path="invoice/:id"
                            element={<InvoicePage />}
                        />


                        {/* WISHLIST */}

                        <Route
                            path="wishlist"
                            element={<WishlistPage />}
                        />


                        {/* PRODUCT MANAGEMENT
                            Existing customer-side routes
                        */}

                        <Route
                            path="product-management"
                            element={<ProductManagement />}
                        />

                        <Route
                            path="add-product"
                            element={<AddProduct />}
                        />

                        <Route
                            path="products/edit/:id"
                            element={<EditProduct />}
                        />


                        {/* SELLER HOME / REGISTRATION */}

                        <Route
                            path="seller-home"
                            element={<SellerLanding />}
                        />

                        <Route
                            path="seller-register"
                            element={<SellerRegister />}
                        />


                        {/* ORDER SUCCESS */}

                        <Route
                            path="success-order/:id"
                            element={<OrderSuccessPage />}
                        />

                    </Route>


                    {/* =================================================
                        CUSTOMER LOGIN
                    ================================================= */}

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />


                    {/* =================================================
                        ADMIN LOGIN
                    ================================================= */}

                    <Route
                        path="/admin-login"
                        element={<AdminLoginPage />}
                    />


                    {/* =================================================
                        SELLER LOGIN
                    ================================================= */}

                    <Route
                        path="/seller-login"
                        element={<SellerLogin />}
                    />


                    {/* =================================================
                        SELLER PASSWORD MANAGEMENT
                    ================================================= */}

                    <Route
                        path="/seller-forgot-password"
                        element={<SellerForgotPassword />}
                    />

                    <Route
                        path="/seller-reset-password"
                        element={<SellerResetPassword />}
                    />


                    {/* =================================================
                        ADMIN PORTAL
                    ================================================= */}

                    <Route
                        path="/admin"
                        element={<AdminLayout />}
                    >

                        {/* ADMIN DASHBOARD */}

                        <Route
                            path="dashboard"
                            element={<AdminDashboard />}
                        />


                        {/* ADMIN ORDERS */}

                        <Route
                            path="orders"
                            element={<AdminOrders />}
                        />


                        {/* ADMIN PRODUCTS */}

                        <Route
                            path="products"
                            element={<ProductManagement />}
                        />


                        {/* ADD PRODUCT */}

                        <Route
                            path="products/add"
                            element={<AddProduct />}
                        />


                        {/* EDIT PRODUCT */}

                        <Route
                            path="products/edit/:id"
                            element={<EditProduct />}
                        />

                        {/* Seller Management */}

                        <Route
                            path="seller-management"
                            element={<SellerManagement />}
                        />


                        {/* ADMIN RETURNS */}

                        <Route
                            path="returns"
                            element={<ReturnOrdersPage />}
                        />

                    </Route>


                    {/* =================================================
                        SELLER PORTAL
                    ================================================= */}

                    <Route
                        path="/seller"
                        element={<SellerLayout />}
                    >

                        {/* DEFAULT SELLER PAGE */}

                        <Route
                            index
                            element={<SellerDashboard />}
                        />


                        {/* SELLER DASHBOARD */}

                        <Route
                            path="dashboard"
                            element={<SellerDashboard />}
                        />


                        {/* SELLER PRODUCTS */}

                        <Route
                            path="products"
                            element={<ProductManagement />}
                        />


                        {/* SELLER ORDERS */}

                        <Route
                            path="orders"
                            element={<AdminOrders />}
                        />


                        {/* SELLER RETURNS */}

                        <Route
                            path="returns"
                            element={<ReturnOrdersPage />}
                        />


                        {/* SELLER SUBSCRIPTION */}

                        <Route
                            path="subscription"
                            element={<Subscription />}
                        />

                    </Route>


                    {/* =================================================
                        FALLBACK
                    ================================================= */}

                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center bg-gray-50">

                                <div className="text-center">

                                    <h1 className="text-5xl font-bold text-gray-800">
                                        404
                                    </h1>

                                    <p className="mt-3 text-gray-500">
                                        Page Not Found
                                    </p>

                                </div>

                            </div>
                        }
                    />

                </Routes>

            </WishlistProvider>

        </CartProvider>
    );
}

export default App;