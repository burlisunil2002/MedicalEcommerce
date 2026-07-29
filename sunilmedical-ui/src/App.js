import { Routes, Route } from "react-router-dom";

// Pages
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
import AdminDashboard from "./pages/AdminDashboard";
import ProductManagement from "./pages/ProductManagement";
import AdminLoginPage from "./pages/AdminLoginPage";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import AdminOrders from "./pages/AdminOrders";
import SellerLanding from "./pages/SellerLanding";
import SellerRegister from "./pages/SellerRegister";
import SellerLogin from "./pages/SellerLogin";
import SellerLayout from "./layouts/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import Subscription from "./pages/seller/Subscription";
import SellerForgotPassword from "./pages/SellerForgotPassword";
import SellerResetPassword from "./pages/SellerResetPassword";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ReturnOrdersPage from "./pages/ReturnOrdersPage";





// Layout
import MainLayout from "./layouts/MainLayout";

// Context
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
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

                    {/* ?? PUBLIC ROUTES */}
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                        path="/admin-login"
                        element={<AdminLoginPage />}
                    />

                    <Route
                        path="/admin/admin-dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="/admin/returns"
                        element={<ReturnOrdersPage />}
                    />

                    {/* ?? MAIN APP WITH HEADER */}
                    <Route path="/" element={<MainLayout />}>

                        {/* HOME */}
                        <Route index element={<ProductList />} />

                        {/* SEARCH */}
                        <Route path="search/:term" element={<SearchResult />} />

                        {/* CATEGORY */}
                        <Route path="category/:categoryName" element={<ProductList />} />

                        {/* PRODUCT DETAILS */}
                        <Route path="product/:id" element={<ProductDetails />} />

                        {/* PROFILE */}
                        <Route path="profile" element={<Profile />} />

                        {/* KYC */}
                        <Route path="kyc/register" element={<KycRegister />} />

                        {/* ?? CART */}
                        <Route path="cart" element={<CartPage />} />

                        {/* ?? CART */}
                        <Route path="checkout" element={<CheckoutPage />} />

                        <Route
                            path="review"
                            element={<ReviewPage />}
                        />

                        <Route
                            path="my-orders"
                            element={<MyOrdersPage />}
                        />

                        <Route
                            path="invoice/:id"
                            element={<InvoicePage />}
                        />

                        {/* ?? WISHLIST */}
                        <Route path="wishlist" element={<WishlistPage />} />


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
                        <Route
                            path="admin-orders"
                            element={<AdminOrders />}
                        />
                        <Route
                            path="seller-home"
                            element={<SellerLanding />}
                        />

                        <Route
                            path="seller-register"
                            element={<SellerRegister />}
                        />

                        <Route
                            path="seller-login"
                            element={<SellerLogin />}
                        />
                        <Route
                            path="seller-forgot-password"
                            element={<SellerForgotPassword />}
                        />

                        <Route
                            path="seller-reset-password"
                            element={<SellerResetPassword />}
                        />
                        <Route
                            path="success-order/:id"
                            element={<OrderSuccessPage />}
                        />

                    </Route>

                    <Route path="seller" element={<SellerLayout />}>

                        <Route
                            index
                            element={<SellerDashboard />}
                        />

                        <Route
                            path="dashboard"
                            element={<SellerDashboard />}
                        />

                        <Route
                            path="products"
                            element={<ProductManagement />}
                        />

                        <Route
                            path="orders"
                            element={<AdminOrders />}
                        />

                        <Route
                            path="subscription"
                            element={<Subscription />}
                        />


                        <Route
                            path="returns"
                            element={<ReturnOrdersPage />}
                        />


                    </Route>

                    {/* ?? FALLBACK */}
                    <Route
                        path="*"
                        element={<div className="p-10 text-center">Page Not Found</div>}
                    />

                </Routes>

            </WishlistProvider>
        </CartProvider>
    );
}

export default App;