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

// Layout
import MainLayout from "./layouts/MainLayout";

// Context
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

function App() {

    return (

        <CartProvider>
            <WishlistProvider>

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
                            path="/product-management"
                            element={<ProductManagement />}
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