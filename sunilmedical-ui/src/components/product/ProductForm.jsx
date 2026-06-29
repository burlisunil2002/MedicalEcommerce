import React, {
    useEffect,
    useState
} from "react";

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
import ValidationSummary from "./ValidationSummary";
import SaveSection from "./SaveSection";


export default function ProductForm({
    mode,
    productId
}) {
    const navigate =
        useNavigate();

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

    const [

        successMessage,

        setSuccessMessage

    ] = useState("");

    const [

        errorMessage,

        setErrorMessage

    ] = useState("");


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

            setErrorMessage(
                err.response?.data?.message ||
                "Unable to load product."
            );

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

    useEffect(() => {

        if (!successMessage)
            return;

        const timer = setTimeout(() => {

            setSuccessMessage("");

        }, 3000);

        return () => clearTimeout(timer);

    }, [successMessage]);

    useEffect(() => {

        if (!errorMessage)
            return;

        const timer = setTimeout(() => {

            setErrorMessage("");

        }, 4000);

        return () => clearTimeout(timer);

    }, [errorMessage]);

    const validate = () => {

        const e = {};

        // ================= BASIC =================

        if (!product.name?.trim())
            e.name = "Product Name is required.";

        if (!product.brand?.trim())
            e.brand = "Brand is required.";

        if (!product.category?.trim())
            e.category = "Category is required.";

        if (!product.description?.trim())
            e.description = "Description is required.";

        if (!product.priceType)
            e.priceType = "Select Price Type.";

        // ================= VARIANTS =================

        const activeVariants =
            product.variants.filter(
                x => x.status !== "Inactive"
            );

        if (activeVariants.length === 0)
            e.variants =
                "At least one variant is required.";

        activeVariants.forEach((variant, index) => {

            if (!variant.model?.trim())
                e[`model_${index}`] =
                    "Model is required.";

            if (
                variant.price === "" ||
                Number(variant.price) <= 0
            )
                e[`price_${index}`] =
                    "Enter valid price.";

            if (
                variant.stockQuantity === "" ||
                Number(variant.stockQuantity) < 0
            )
                e[`stock_${index}`] =
                    "Enter stock quantity.";

        });

        setErrors(e);

        return Object.keys(e).length === 0;

    };
    const scrollToError = () => {

        setTimeout(() => {

            const firstError =
                document.querySelector(
                    ".border-red-500"
                );

            if (firstError) {

                firstError.scrollIntoView({

                    behavior: "smooth",

                    block: "center"

                });

                firstError.focus();

            }

        }, 100);

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
    const handleSubmit =
        async (e) => {

            e.preventDefault();

            if (loading)
                return;

            if (!validate()) {

                scrollToError();

                return;

            }

            try {

                setLoading(true);

                setErrors({});

                setErrorMessage("");

                setSuccessMessage("");

                const formData =
                    buildFormData();

                if (
                    mode === "add"
                ) {

                    await API.post(

                        "/api/products",

                        formData

                    );

                    setSuccessMessage(

                        "Product added successfully."

                    );

                }

                else {

                    await API.put(

                        `/api/products/${productId}`,

                        formData

                    );

                    setSuccessMessage(

                        "Product updated successfully."

                    );

                }

                setTimeout(() => {

                    navigate(

                        "/product-management"

                    );

                }, 1000);

            }

            catch (err) {

                console.log(err);

                if (
                    err.response?.data?.errors
                ) {

                    setErrors(

                        err.response.data.errors

                    );

                    scrollToError();

                    return;

                }

                setErrorMessage(

                    err.response?.data?.message ||

                    "Unable to save product."

                );

            }

            finally {

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

        { successMessage && (

            <div
                className="mb-5 rounded-xl bg-green-100 p-4 text-green-700"
            >

                {successMessage}

            </div>

        )}

{
    errorMessage && (

        <div
            className="mb-5 rounded-xl bg-red-100 p-4 text-red-700"
        >

            {errorMessage}

        </div>

    )
}
        <form onSubmit={handleSubmit}>

            <ValidationSummary
                errors={errors}
            />

            <BasicInfoSection
                product={product}
                setProduct={setProduct}
                errors={errors}
                handleChange={handleChange}
            />

            <ProductImageSection
                product={product}
                setProduct={setProduct}
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
