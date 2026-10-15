import React, { useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

const FIELD_LABELS = {
    name: "Product name",
    brand: "Brand",
    category: "Category",
    description: "Description",
    priceType: "Price type",
    imageFile: "Product image",
    quotationFile: "Quotation file",
    gstPercentage: "GST percentage",
    hsnCode: "HSN code",
    variants: "Variants",
};

const getLabel = (key) => {
    if (FIELD_LABELS[key]) return FIELD_LABELS[key];

    const match = String(key).match(/^(model|price|stock|images|specifications)_(\d+)$/i);
    if (match) {
        const [, field, rawIndex] = match;
        const fieldLabels = {
            model: "Model",
            price: "Price",
            stock: "Stock quantity",
            images: "Variant images",
            specifications: "Specifications",
        };
        return `Variant ${Number(rawIndex) + 1} — ${fieldLabels[field.toLowerCase()] || field}`;
    }

    return String(key)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_\.]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

export default function ValidationSummary({ errors = {} }) {
    const errorList = useMemo(
        () =>
            Object.entries(errors || {})
                .map(([key, value]) => ({
                    key,
                    label: getLabel(key),
                    message: Array.isArray(value)
                        ? value.filter(Boolean).join(" ")
                        : String(value ?? "").trim(),
                }))
                .filter((item) => item.message),
        [errors]
    );

    useEffect(() => {
        if (errorList.length === 0) {
            toast.dismiss("product-form-validation");
            return;
        }

        // Put every validation message in one toast so users can read them
        // together without a stack of separate notifications covering the form.
        toast.error(
            <div className="w-full">
                <p className="mb-2 font-bold">
                    Please correct {errorList.length === 1 ? "this field" : "these fields"}
                </p>
                <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                    {errorList.map(({ key, label, message }) => (
                        <li key={key}>
                            <span className="font-semibold">{label}:</span>{" "}
                            {message}
                        </li>
                    ))}
                </ul>
            </div>,
            {
                id: "product-form-validation",
                duration: 8000,
                style: {
                    maxWidth: "min(560px, calc(100vw - 32px))",
                    alignItems: "flex-start",
                },
            }
        );
    }, [errorList]);

    // Do not render the old validation box at the top of the form.
    return null;
}
