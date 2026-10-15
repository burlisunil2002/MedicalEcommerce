import React from "react";
import { useParams } from "react-router-dom";
import ProductForm from "../components/product/ProductForm";

export default function EditProduct() {
    const { id } = useParams();

    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
                <section
                    className="w-full max-w-md rounded-2xl border border-red-200
                               bg-white p-6 text-center shadow-sm"
                    role="alert"
                >
                    <h1 className="text-xl font-bold text-slate-900">
                        Invalid Product
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        The product ID is missing or invalid.
                        Return to product management and select a product.
                    </p>

                    <a
                        href="/product-management"
                        className="mt-5 inline-flex items-center justify-center
                                   rounded-xl bg-blue-600 px-5 py-3 font-semibold
                                   text-white transition hover:bg-blue-700"
                    >
                        Back to Product Management
                    </a>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
                <ProductForm
                    mode="edit"
                    productId={productId}
                />
            </div>
        </main>
    );
}