import { Outlet } from "react-router-dom";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";
import FloatingWhatsApp from "../components/FloatingWhatsApp";

export default function MainLayout() {
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">

            <MainHeader />

            <main className="flex-grow">
                <Outlet />   {/* 🔥 THIS FIXES DOUBLE HEADER */}
            </main>

            <FloatingWhatsApp />

            <MainFooter />

        </div>
    );
}