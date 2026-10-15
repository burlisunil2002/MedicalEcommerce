import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
    useNavigate
} from "react-router-dom";

import API from "../../services/api";

import BasicInfoSection from "./BasicInfoSection";
import ProductImageSection from "./ProductImageSection";
import PricingSection from "./PricingSection";
import MedicalInfoSection from "./MedicalInfoSection";
import DealSection from "./DealSection";
import VariantSection from "./VariantSection";
import SaveSection from "./SaveSection";


export default function ProductForm({
    mode,
    productId
}) {
    const navigate =
        useNavigate();


    const showValidationToast = (errorObject, duration = 9000) => {
        const fieldLabels = {
            name: "Product name",
            brand: "Brand",
            category: "Category",
            description: "Description",
            priceType: "Price type",
            imageFile: "Product image",
            quotationFile: "Quotation file",
            gstPercentage: "GST percentage",
            hsnCode: "HSN code",
            variants: "Variants"
        };

        const entries = Object.entries(errorObject || {})
            .map(([key, value]) => ({
                key,
                message: Array.isArray(value)
                    ? value.filter(Boolean).join(" ")
                    : String(value ?? "").trim()
            }))
            .filter(item => item.message);

        if (entries.length === 0) {
            toast.error("Please review the product information and try again.", {
                duration,
                style: { maxWidth: "min(620px, calc(100vw - 28px))", zIndex: 99999 }
            });
            return;
        }

        const getLabel = (key) => {
            if (fieldLabels[key]) return fieldLabels[key];

            const match = String(key).match(/^(model|price|stock|images|specifications)_(\d+)$/i);
            if (match) {
                const labels = {
                    model: "Model",
                    price: "Price",
                    stock: "Stock quantity",
                    images: "Variant images",
                    specifications: "Specifications"
                };
                return `Variant ${Number(match[2]) + 1} — ${labels[match[1].toLowerCase()]}`;
            }

            return String(key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_\.]+/g, " ");
        };

        const message = entries
            .map(({ key, message }) => `${getLabel(key)}: ${message}`)
            .join("  •  ");

        // Plain-string toast is reliable across react-hot-toast versions and styling.
        toast.error(message, {
            duration,
            style: {
                maxWidth: "min(620px, calc(100vw - 28px))",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                zIndex: 99999
            }
        });
    };

    const defaultProduct = {

        id: 0,

        brand: "",

        name: "",

        category: "",

        description: "",

        gstPercentage: 18,

        hsnCode: "",

        priceType: "Normal",

        imageFiles: [],
        imagePreviews: [],
        images: [],

        quotationFile: null,

        quotationUrl: "",

        isHotDeal: false,

        discountPercentage: "",

        dealEndDate: "",

        weight: "",

        isFragile: false,

        batchNumber: "",

        expiryDate: "",

        variants: [

            {

                productVariantId: 0,

                model: "",

                size: "",

                unit: "",

                packSize: "",

                minQuantity: 1,

                maxQuantity: "",

                stepQuantity: 1,

                price: "",

                stockQuantity: "",

                imageFiles: [],
                imagePreviews: [],
                images: [],

                status: "Active",

                specifications: [

                    {
                        key: "",
                        value: ""
                    }

                ]

            }

        ]

    };

    const [

        product,

        setProduct

    ] = useState(
        defaultProduct
    );

    const [

        loading,

        setLoading

    ] = useState(false);

    const [

        pageLoading,

        setPageLoading

    ] = useState(
        mode === "edit"
    );

    const [

        errors,

        setErrors

    ] = useState({});
    const loadProduct = async () => {

        try {

            setPageLoading(true);

            const res = await API.get(
                `/api/products/edit/${productId}`
            );

            const p = res.data.product;

            setProduct({

                ...p,

                // Product Image (Single)
                imageFile: null,
                imagePreview: p.imageUrl || "",

                quotationFile: null,
                quotationUrl: p.quotationUrl || "",

                // Variants
                variants: (p.variants || []).map(v => ({

                    ...v,

                    imageFiles: [],

                    imagePreviews:
                        (v.images || []).map(img => img.imageUrl),

                    images:
                        v.images || [],

                    specifications:
                        v.specifications || []

                }))

            });

        }
        catch (err) {

            console.error(err);

            toast.error(err.response?.data?.message || "Unable to load product.");

        }
        finally {

            setPageLoading(false);

        }

    };

    useEffect(() => {

        if (mode !== "edit" || !productId)
            return;

        loadProduct();

    }, [mode, productId]);

    const handleChange =
        e => {

            const {

                name,

                value,

                type,

                checked

            } = e.target;

            setProduct(
                prev => ({

                    ...prev,

                    [name]:

                        type === "checkbox"

                            ? checked

                            : value

                })
            );

        };

    const handleQuotation =
        e => {

            const file =
                e.target.files[0];

            if (!file)
                return;

            setProduct(
                prev => ({

                    ...prev,

                    quotationFile:
                        file

                })
            );

        };

    const addVariant = () => {

        setProduct(prev => ({

            ...prev,

            variants: [

                ...prev.variants,

                {

                    productVariantId: 0,

                    model: "",

                    size: "",

                    unit: "",

                    packSize: "",

                    minQuantity: 1,

                    maxQuantity: "",

                    stepQuantity: 1,

                    price: "",

                    stockQuantity: "",

                    imageFiles: [],

                    imagePreviews: [],

                    images: [],

                    status: "Active",

                    specifications: [

                        {
                            key: "",
                            value: ""
                        }

                    ]

                }

            ]

        }));

    };

    const updateVariant = (

        index,

        field,

        value

    ) => {

        setProduct(prev => ({

            ...prev,

            variants:

                prev.variants.map(

                    (v, i) =>

                        i === index

                            ? {

                                ...v,

                                [field]: value

                            }

                            : v

                )

        }));

    };

    const updateVariantImages = (index, files) => {

        console.clear();

        console.log("========== updateVariantImages ==========");

        console.log("Variant Index:", index);

        console.log("Received Files:", files);

        console.log("Files Count:", files?.length);

        if (!files || files.length === 0) {

            console.error("❌ No files received.");

            return;

        }

        const previews = files.map(file => URL.createObjectURL(file));

        console.log("Generated Preview URLs:", previews);

        setProduct(prev => {

            console.log("Previous Variant:", prev.variants[index]);

            const updatedVariants = prev.variants.map((variant, i) =>

                i === index
                    ? {

                        ...variant,

                        imageFiles: [...files],

                        imagePreviews: [...previews]

                    }
                    : variant

            );

            console.log("Updated Variant:", updatedVariants[index]);

            console.log(
                "Updated imageFiles:",
                updatedVariants[index].imageFiles
            );

            console.log(
                "Updated imagePreviews:",
                updatedVariants[index].imagePreviews
            );

            return {

                ...prev,

                variants: updatedVariants

            };

        });

        console.log("========== END ==========");

    };

    const removeVariantImages = (variantIndex, imageIndex) => {

        setProduct(prev => ({

            ...prev,

            variants: prev.variants.map((variant, i) =>

                i === variantIndex
                    ? {

                        ...variant,

                        imageFiles:
                            variant.imageFiles.filter(

                                (_, idx) => idx !== imageIndex

                            ),

                        imagePreviews:
                            variant.imagePreviews.filter(

                                (_, idx) => idx !== imageIndex

                            )

                    }

                    : variant

            )

        }));

    };

    const addSpecification = (

        variantIndex

    ) => {

        setProduct(prev => ({

            ...prev,

            variants:

                prev.variants.map(

                    (variant, i) =>

                        i === variantIndex

                            ? {

                                ...variant,

                                specifications: [

                                    ...variant.specifications,

                                    {

                                        key: "",

                                        value: ""

                                    }

                                ]

                            }

                            : variant

                )

        }));

    };

    const removeVariant = (index) => {

        setProduct(prev => {

            const variants = [...prev.variants];

            if (
                variants[index].productVariantId > 0
            ) {

                variants[index] = {
                    ...variants[index],
                    status: "Inactive"
                };

            }
            else {

                variants.splice(index, 1);

            }

            return {

                ...prev,

                variants

            };

        });

    };
    const removeSpecification = (

        variantIndex,

        specificationIndex

    ) => {

        setProduct(prev => ({

            ...prev,

            variants:

                prev.variants.map(

                    (variant, i) =>

                        i === variantIndex

                            ? {

                                ...variant,

                                specifications:

                                    variant.specifications.filter(

                                        (_, s) =>

                                            s !== specificationIndex

                                    )

                            }

                            : variant

                )

        }));

    };
    const updateSpecification = (

        variantIndex,

        specificationIndex,

        field,

        value

    ) => {

        setProduct(prev => ({

            ...prev,

            variants:

                prev.variants.map(

                    (variant, i) =>

                        i === variantIndex

                            ? {

                                ...variant,

                                specifications:

                                    variant.specifications.map(

                                        (spec, s) =>

                                            s === specificationIndex

                                                ? {

                                                    ...spec,

                                                    [field]: value

                                                }

                                                : spec

                                    )

                            }

                            : variant

                )

        }));

    };
    const removeProductImage = () => {

        setProduct(prev => ({

            ...prev,

            imageFile: null,

            imagePreview: "",

            imageUrl: ""

        }));

    };

    const handleImage = (e) => {

        const file = e.target.files[0];

        if (!file)
            return;

        setProduct(prev => ({

            ...prev,

            imageFile: file,

            imagePreview:
                URL.createObjectURL(file)

        }));

    };
    const validate = () => {
        const e = {};

        // Product fields
        if (!product.name?.trim()) {
            e.name = "Product Name is required.";
        }

        if (!product.brand?.trim()) {
            e.brand = "Brand is required.";
        }

        if (!product.category?.trim()) {
            e.category = "Category is required.";
        }

        if (!product.description?.trim()) {
            e.description = "Description is required.";
        }

        if (!product.priceType) {
            e.priceType = "Select Price Type.";
        }

        // Required when adding a new product
        if (mode === "add" && !product.imageFile) {
            e.imageFile = "Please upload a product image.";
        }

        const activeVariants = product.variants
            .map((variant, index) => ({ variant, index }))
            .filter(({ variant }) => variant.status !== "Inactive");

        if (activeVariants.length === 0) {
            e.variants = "At least one active variant is required.";
        }

        activeVariants.forEach(({ variant, index }) => {
            if (!variant.model?.trim()) {
                e[`model_${index}`] = "Variant model is required.";
            }

            if (
                variant.price === "" ||
                !Number.isFinite(Number(variant.price)) ||
                Number(variant.price) <= 0
            ) {
                e[`price_${index}`] = "Enter a valid price.";
            }

            if (
                variant.stockQuantity === "" ||
                variant.stockQuantity === null ||
                variant.stockQuantity === undefined ||
                !Number.isFinite(Number(variant.stockQuantity)) ||
                Number(variant.stockQuantity) < 0
            ) {
                e[`stock_${index}`] = "Enter a valid stock quantity.";
            }

            // Add Product requires new variant images.
            // During editing, existing images can be retained.
            const hasExistingImages =
                (variant.images?.length ?? 0) > 0 ||
                (variant.imagePreviews?.length ?? 0) > 0;

            const hasNewImages =
                (variant.imageFiles?.length ?? 0) > 0;

            if (
                mode === "add" &&
                !hasNewImages
            ) {
                e[`images_${index}`] =
                    `Upload at least one image for "${variant.model || "this variant"}".`;
            }

            if (
                mode === "edit" &&
                !hasExistingImages &&
                !hasNewImages
            ) {
                e[`images_${index}`] =
                    `Upload at least one image for "${variant.model || "this variant"}".`;
            }

            const validSpecifications =
                (variant.specifications || []).filter(
                    s => s.key?.trim() && s.value?.trim()
                );

            if (validSpecifications.length === 0) {
                e[`specifications_${index}`] =
                    `Add at least one complete specification for "${variant.model || "this variant"}".`;
            }
        });

        return e;
    };



    // Convert ASP.NET Core ModelState keys into the same field keys used by
    // client-side validation so inline field errors and scrolling work together.
    const normalizeServerErrors = (serverErrors) => {
        const mapped = {};

        if (!serverErrors || typeof serverErrors !== "object") {
            return mapped;
        }

        const toMessage = (value) =>
            Array.isArray(value) ? value.filter(Boolean).join(" ") : String(value ?? "");

        Object.entries(serverErrors).forEach(([serverKey, value]) => {
            const message = toMessage(value);
            if (!message) return;

            const key = String(serverKey);
            const lower = key.toLowerCase();
            let fieldKey = key;

            if (lower.includes("variants[") || lower.includes("variants.")) {
                const indexMatch = lower.match(/variants\[(\d+)\]/) ||
                    lower.match(/variants\.(\d+)/);
                const index = indexMatch?.[1];

                if (index !== undefined) {
                    if (/\.model$/i.test(key)) fieldKey = `model_${index}`;
                    else if (/\.price$/i.test(key)) fieldKey = `price_${index}`;
                    else if (/\.stockquantity$/i.test(key)) fieldKey = `stock_${index}`;
                    else if (/\.imagefiles?$/i.test(key) || /\.images?$/i.test(key)) fieldKey = `images_${index}`;
                    else if (/\.specifications?/i.test(key)) fieldKey = `specifications_${index}`;
                    else fieldKey = `variant_${index}`;
                }
            } else if (/^(name|product\.name)$/i.test(key)) fieldKey = "name";
            else if (/^brand$/i.test(key)) fieldKey = "brand";
            else if (/^category$/i.test(key)) fieldKey = "category";
            else if (/^description$/i.test(key)) fieldKey = "description";
            else if (/^pricetype$/i.test(key)) fieldKey = "priceType";
            else if (/^(imagefile|imageurl)$/i.test(key)) fieldKey = "imageFile";
            else if (/^quotation(file|url)$/i.test(key)) fieldKey = "quotationFile";

            mapped[fieldKey] = mapped[fieldKey]
                ? `${mapped[fieldKey]} ${message}`
                : message;
        });

        return mapped;
    };

    const scrollToError = (errorObject = errors) => {
        window.setTimeout(() => {
            const keys = Object.keys(errorObject || {});
            const selectorsForKey = (key) => {
                const lower = key.toLowerCase();
                const candidates = [];

                const add = (selector) => {
                    if (selector && !candidates.includes(selector)) candidates.push(selector);
                };

                if (lower === "name") {
                    add('[name="name"]'); add('#name'); add('[name="Name"]');
                } else if (lower === "brand") {
                    add('[name="brand"]'); add('#brand'); add('[name="Brand"]');
                } else if (lower === "category") {
                    add('[name="category"]'); add('#category'); add('[name="Category"]');
                } else if (lower === "description") {
                    add('[name="description"]'); add('#description'); add('[name="Description"]');
                } else if (lower === "pricetype") {
                    add('[name="priceType"]'); add('#priceType'); add('[name="PriceType"]');
                } else if (lower === "imagefile") {
                    add('[name="imageFile"]'); add('#imageFile'); add('#imageFile-input'); add('#imageFile-section');
                    add('input[type="file"]:not([name="quotationFile"])');
                } else if (lower === "quotationfile") {
                    add('[name="quotationFile"]'); add('#quotationFile');
                } else {
                    const variantMatch = lower.match(/^(model|price|stock|images|specifications)_(\d+)$/);
                    if (variantMatch) {
                        const [, field, index] = variantMatch;
                        const serverField = {
                            model: "Model",
                            price: "Price",
                            stock: "StockQuantity",
                            images: "ImageFiles",
                            specifications: "Specifications"
                        }[field];
                        add(`[name="Variants[${index}].${serverField}"]`);
                        add(`[name="variants[${index}].${serverField}"]`);
                        add(`[name="${field}_${index}"]`);
                        add(`#${field}_${index}`);
                        add(`#variant-${index}`);
                        if (field === "images") add('label#imageFile');
                        if (field === "images") add(`input[type="file"][name*="Variants[${index}]"]`);
                    }
                }

                add(`[name="${key.replace(/"/g, '\\"')}"]`);
                add(`#${key.replace(/"/g, '\\"')}`);
                return candidates;
            };

            let target = null;

            for (const key of keys) {
                for (const selector of selectorsForKey(key)) {
                    try {
                        target = document.querySelector(selector);
                    } catch {
                        target = null;
                    }
                    if (target) break;
                }
                if (target) break;
            }

            // Fallback to common invalid-field styles if the section uses
            // generated ids/names rather than the expected field keys.
            if (!target) {
                target = document.querySelector(
                    '[aria-invalid="true"], input.border-red-500, select.border-red-500, textarea.border-red-500, .border-red-500'
                );
            }

            if (!target) {
                const form = document.querySelector("form");
                if (form) {
                    form.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                return;
            }

            const focusable = target.matches?.("input, textarea, select, button, [tabindex]") ||
                target.matches?.('[contenteditable="true"]')
                ? target
                : target.querySelector?.('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])');

            const scrollTarget = target.closest?.(
                ".form-field, .mb-4, .mb-6, section, fieldset, label"
            ) || target;

            scrollTarget.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            if (focusable && typeof focusable.focus === "function") {
                window.setTimeout(() => focusable.focus({ preventScroll: true }), 250);
            }
        }, 120);
    };

    const buildFormData = () => {

        const formData =
            new FormData();

        // ================= PRODUCT =================

        formData.append(
            "Id",
            product.id
        );

        formData.append(
            "Brand",
            product.brand
        );

        formData.append(
            "Name",
            product.name
        );

        formData.append(
            "Category",
            product.category
        );

        formData.append(
            "Description",
            product.description
        );

        formData.append(
            "GSTPercentage",
            product.gstPercentage || 0
        );

        formData.append(
            "HSNCode",
            product.hsnCode || ""
        );

        formData.append(
            "PriceType",
            product.priceType
        );

        formData.append(
            "IsHotDeal",
            product.isHotDeal
        );

        formData.append(
            "DiscountPercentage",
            product.discountPercentage || ""
        );

        formData.append(
            "DealEndDate",
            product.dealEndDate || ""
        );

        formData.append(
            "Weight",
            product.weight || ""
        );

        formData.append(
            "BatchNumber",
            product.batchNumber || ""
        );

        formData.append(
            "ExpiryDate",
            product.expiryDate || ""
        );

        formData.append(
            "IsFragile",
            product.isFragile
        );

        if (product.imageFile)
            formData.append(
                "imageFile",
                product.imageFile
            );

        if (product.quotationFile)
            formData.append(
                "quotationFile",
                product.quotationFile
            );

        // ================= VARIANTS =================

        product.variants.forEach(

            (variant, i) => {

                formData.append(
                    `Variants[${i}].ProductVariantId`,
                    variant.productVariantId
                );

                formData.append(
                    `Variants[${i}].Model`,
                    variant.model
                );

                formData.append(
                    `Variants[${i}].Size`,
                    variant.size || ""
                );

                formData.append(
                    `Variants[${i}].Unit`,
                    variant.unit || ""
                );

                formData.append(
                    `Variants[${i}].PackSize`,
                    variant.packSize || ""
                );

                formData.append(
                    `Variants[${i}].MinQuantity`,
                    variant.minQuantity
                );

                formData.append(
                    `Variants[${i}].MaxQuantity`,
                    variant.maxQuantity || ""
                );

                formData.append(
                    `Variants[${i}].StepQuantity`,
                    variant.stepQuantity
                );

                formData.append(
                    `Variants[${i}].Price`,
                    variant.price
                );

                formData.append(
                    `Variants[${i}].StockQuantity`,
                    variant.stockQuantity
                );

                formData.append(
                    `Variants[${i}].Status`,
                    variant.status
                );

                variant.imageFiles?.forEach(file => {

                    formData.append(

                        `Variants[${i}].ImageFiles`,

                        file

                    );

                });

                variant.specifications.forEach(

                    (spec, j) => {

                        formData.append(
                            `Variants[${i}].Specifications[${j}].Key`,
                            spec.key
                        );

                        formData.append(
                            `Variants[${i}].Specifications[${j}].Value`,
                            spec.value
                        );

                    }

                );

            }

        );

        return formData;

    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showValidationToast(validationErrors);
            scrollToError(validationErrors);
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const formData = buildFormData();
            const isAdd = mode === "add";

            if (isAdd) {
                await API.post("/api/products", formData);
            } else {
                await API.put(`/api/products/${productId}`, formData);
            }

            toast.success(
                isAdd
                    ? "Product added successfully."
                    : "Product updated successfully."
            );

            // The app-level Toaster stays mounted across route changes.
            window.setTimeout(() => {
                navigate("/product-management");
            }, 1200);
        } catch (err) {
            const data = err.response?.data;

            console.error("ADD/EDIT PRODUCT ERROR", {
                status: err.response?.status,
                response: data,
                requestUrl: err.config?.url,
                method: err.config?.method
            });

            const normalizedErrors = normalizeServerErrors(data?.errors);
            const validationMessage = Object.values(normalizedErrors).join(" ");

            const message =
                validationMessage ||
                data?.message ||
                data?.title ||
                (err.response?.status === 400
                    ? "The submitted product information was rejected. Please check the highlighted fields."
                    : err.response?.status === 401
                        ? "Your session may have expired. Please sign in again."
                        : err.response?.status === 403
                            ? "You are not allowed to perform this action. Check your subscription or permissions."
                            : "Unable to save the product. Please try again.");

            if (Object.keys(normalizedErrors).length > 0) {
                setErrors(normalizedErrors);
                showValidationToast(normalizedErrors, 8000);
                scrollToError(normalizedErrors);
            } else {
                toast.error(message, { duration: 6000 });
                // When the server sends a known field-level message but not
                // a ModelState dictionary, infer its field for a useful jump.
                const lower = String(data?.message || data?.title || "").toLowerCase();
                const inferred = {};

                if (lower.includes("product name") || lower.includes("name is required")) {
                    inferred.name = message;
                } else if (lower.includes("brand")) {
                    inferred.brand = message;
                } else if (lower.includes("category")) {
                    inferred.category = message;
                } else if (lower.includes("description")) {
                    inferred.description = message;
                } else if (lower.includes("product image") || lower.includes("upload an image")) {
                    inferred.imageFile = message;
                } else if (lower.includes("variant") && lower.includes("model")) {
                    inferred.model_0 = message;
                } else if (lower.includes("price")) {
                    inferred.price_0 = message;
                }

                if (Object.keys(inferred).length > 0) {
                    setErrors(inferred);
                    scrollToError(inferred);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {

        return (

            <div className="p-20 text-center">

                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>

            </div>

        );

    }

    return (


        <>

            <div className="mb-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                    ← Back
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <BasicInfoSection
                    product={product}
                    setProduct={setProduct}
                    errors={errors}
                    handleChange={handleChange}
                />

                <ProductImageSection
                    product={product}
                    setProduct={setProduct}
                    errors={errors}
                    handleImage={handleImage}
                    handleQuotation={handleQuotation}
                    removeProductImage={removeProductImage}
                />

                <PricingSection
                    product={product}
                    handleChange={handleChange}
                    errors={errors}
                />

                <MedicalInfoSection
                    product={product}
                    handleChange={handleChange}
                    errors={errors}
                />

                <DealSection
                    product={product}
                    handleChange={handleChange}
                    errors={errors}
                />


                <VariantSection

                    variants={product.variants}

                    errors={errors}

                    addVariant={addVariant}

                    removeVariant={removeVariant}

                    updateVariant={updateVariant}

                    updateVariantImages={updateVariantImages}

                    removeVariantImages={removeVariantImages}

                    addSpecification={addSpecification}

                    removeSpecification={removeSpecification}

                    updateSpecification={updateSpecification}

                />

                <SaveSection
                    loading={loading}
                    mode={mode}
                />

            </form>
        </>
    );
}
