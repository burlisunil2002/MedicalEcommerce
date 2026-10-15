import React from "react";
import ProductForm from "../components/product/ProductForm";

export default function AddProduct() {
    return (
        <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
                <ProductForm mode="add" />
            </div>
        </main>
    );
}

