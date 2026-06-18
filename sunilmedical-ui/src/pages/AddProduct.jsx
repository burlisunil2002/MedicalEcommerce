import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";



const categories = [
    "Mother & Child Care",
    "Radiology",
    "Critical Care Equipment",
    "Lab & Diagnostics",
    "Consumables & Disposables",
    "Thermal Camera",
    "Medicine Vending Machine",
    "Surgical Instruments",
    "Hospital Furniture",
    "iLAB",
    "Safe Zone Container",
    "Oxy Wheel",
    "Water Recycling System",
    "Portable Ventilators",
    "Anesthesia Machine",
    "Point of Care Devices",
    "Prosthesis",
    "Instruments",
    "Uroflowrometry",
    "Microbiology"
];

export default function AddProduct() {
    const navigate = useNavigate();

    const [product, setProduct] =
        useState({
            name: "",
            brand: "",
            category: "",
            description: "",
            gstPercentage: "",
            hsnCode: "",
            priceType: "Normal",
            batchNumber: "",
            expiryDate: "",
            weight: "",
            isFragile: false,
            isHotDeal: false,
            discountPercentage: "",
            dealEndDate: "",

            imageFile: null,
            quotationFile: null,

            variants: []
        });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData =
                new FormData();

            formData.append(
                "Name",
                product.name
            );

            formData.append(
                "Brand",
                product.brand
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
                product.gstPercentage
            );

            formData.append(
                "HSNCode",
                product.hsnCode
            );

            formData.append(
                "PriceType",
                product.priceType
            );

            formData.append(
                "BatchNumber",
                product.batchNumber
            );

            formData.append(
                "Weight",
                product.weight
            );

            formData.append(
                "IsFragile",
                product.isFragile
            );

            formData.append(
                "IsHotDeal",
                product.isHotDeal
            );

            formData.append(
                "DiscountPercentage",
                product.discountPercentage
            );

            if (product.expiryDate)
                formData.append(
                    "ExpiryDate",
                    product.expiryDate
                );

            if (product.dealEndDate)
                formData.append(
                    "DealEndDate",
                    product.dealEndDate
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

            product.variants.forEach(
                (v, i) => {

                    formData.append(
                        `Variants[${i}].Model`,
                        v.model
                    );

                    formData.append(
                        `Variants[${i}].Size`,
                        v.size
                    );

                    formData.append(
                        `Variants[${i}].Unit`,
                        v.unit
                    );

                    formData.append(
                        `Variants[${i}].PackSize`,
                        v.packSize
                    );

                    formData.append(
                        `Variants[${i}].MinQuantity`,
                        v.minQuantity
                    );

                    formData.append(
                        `Variants[${i}].MaxQuantity`,
                        v.maxQuantity
                    );

                    formData.append(
                        `Variants[${i}].StepQuantity`,
                        v.stepQuantity
                    );

                    formData.append(
                        `Variants[${i}].Price`,
                        v.price
                    );

                    formData.append(
                        `Variants[${i}].StockQuantity`,
                        v.stockQuantity
                    );

                    if (v.imageFile)
                        formData.append(
                            `Variants[${i}].ImageFile`,
                            v.imageFile
                        );

                    v.specifications.forEach(
                        (s, j) => {

                            formData.append(
                                `Variants[${i}].Specifications[${j}].Key`,
                                s.key
                            );

                            formData.append(
                                `Variants[${i}].Specifications[${j}].Value`,
                                s.value
                            );

                        }
                    );

                }
            );

            const res =
                await API.post(
                    "/api/products",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            alert(
                "Product added successfully"
            );
            navigate("/product-management");


            console.log(res.data);

        } catch (err) {

            console.log(
                err.response
            );

            alert(
                err.response?.data?.message ||
                err.message
            );
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setProduct((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const addVariant = () => {
        setProduct((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    model: "",
                    size: "",
                    unit: "",
                    packSize: "",
                    minQuantity: "",
                    maxQuantity: "",
                    stepQuantity: "",
                    price: "",
                    stockQuantity: "",
                    specifications: []
                }
            ]
        }));
    };

    const removeVariant = (index) => {
        setProduct((prev) => ({
            ...prev,
            variants: prev.variants.filter(
                (_, i) => i !== index
            )
        }));
    };

    const addSpecification = (vIndex) => {
        const updated = [...product.variants];

        updated[vIndex].specifications.push({
            key: "",
            value: ""
        });

        setProduct({
            ...product,
            variants: updated
        });
    };

    const removeSpecification = (
        vIndex,
        sIndex
    ) => {
        const updated = [...product.variants];

        updated[vIndex].specifications =
            updated[vIndex].specifications.filter(
                (_, i) => i !== sIndex
            );

        setProduct({
            ...product,
            variants: updated
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 text-slate-800">
            <div className="max-w-7xl mx-auto">

                <form onSubmit={handleSubmit}>


                <div className="mb-10">
                    <h1 className="text-4xl font-bold">
                        Add Medical Product
                    </h1>

                        <p className="text-slate-500 mt-2">
                            Create products, variants and
                        specifications
                    </p>
                </div>

                <div className="space-y-8">

                    {/* BASIC */}

                        <div className="
bg-white/80
backdrop-blur-xl
border
border-white/50
rounded-[30px]
p-8
shadow-xl
">
                            <h2 className="
text-2xl
font-bold
text-slate-800
mb-6
">                            Basic Information
                        </h2>

                        <div className="grid md:grid-cols-2 gap-5">

                            <input
                                name="name"
                                value={product.name}
                                onChange={handleChange}
                                placeholder="Product Name"
                                className="input"
                            />

                            <input
                                name="brand"
                                value={product.brand}
                                onChange={handleChange}
                                placeholder="Brand Name"
                                className="input"
                            />

                            <select
                                name="category"
                                value={product.category}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">
                                    Select Category
                                </option>

                                {categories.map((c) => (
                                    <option
                                        key={c}
                                        value={c}
                                    >
                                        {c}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="priceType"
                                value={product.priceType}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Normal">
                                    Normal
                                </option>

                                <option value="AskForPrice">
                                    Ask For Price
                                </option>
                            </select>

                            <input
                                name="gstPercentage"
                                value={
                                    product.gstPercentage
                                }
                                onChange={handleChange}
                                placeholder="GST %"
                                className="input"
                            />

                            <input
                                name="hsnCode"
                                value={product.hsnCode}
                                onChange={handleChange}
                                placeholder="HSN Code"
                                className="input"
                            />
                        </div>

                        <textarea
                            name="description"
                            value={product.description}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={5}
                            className="input mt-5"
                        />
                    </div>

                    <div className="bg-white/10 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-6">
                            Product Files
                        </h2>

                        <div className="grid md:grid-cols-2 gap-5">

                            <div>
                                <label className="block mb-2">
                                    Product Image
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setProduct(prev => ({
                                            ...prev,
                                            imageFile:
                                                e.target.files[0]
                                        }))
                                    }
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">
                                    Quotation File
                                </label>

                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setProduct(prev => ({
                                            ...prev,
                                            quotationFile:
                                                e.target.files[0]
                                        }))
                                    }
                                    className="input"
                                />
                            </div>

                        </div>
                    </div>

                    {/* MEDICAL */}

                    <div className="bg-white/10 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-6">
                            Medical Information
                        </h2>

                        <div className="grid md:grid-cols-3 gap-5">

                            <input
                                name="batchNumber"
                                value={
                                    product.batchNumber
                                }
                                onChange={handleChange}
                                placeholder="Batch Number"
                                className="input"
                            />

                            <input
                                type="date"
                                name="expiryDate"
                                value={
                                    product.expiryDate
                                }
                                onChange={handleChange}
                                className="input"
                            />

                            <input
                                name="weight"
                                value={product.weight}
                                onChange={handleChange}
                                placeholder="Weight"
                                className="input"
                            />
                        </div>
                    </div>

                    {/* OPTIONS */}

                    <div className="bg-white/10 rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-6">
                            Deals & Options
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isFragile"
                                    checked={
                                        product.isFragile
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                                Fragile Product
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isHotDeal"
                                    checked={
                                        product.isHotDeal
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                                Hot Deal 🔥
                            </label>

                            <input
                                name="discountPercentage"
                                value={
                                    product.discountPercentage
                                }
                                onChange={handleChange}
                                placeholder="Discount %"
                                className="input"
                            />

                            <input
                                type="datetime-local"
                                name="dealEndDate"
                                value={
                                    product.dealEndDate
                                }
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* VARIANTS */}

                    <div className="bg-white/10 rounded-3xl p-8">

                        <div className="flex justify-between mb-6">
                            <h2 className="text-2xl font-bold">
                                Product Variants
                            </h2>

                            <button
                                type="button"
                                onClick={addVariant}
                                className="bg-indigo-600 px-5 py-3 rounded-xl"
                            >
                                + Add Variant
                            </button>
                        </div>

                        {product.variants.map(
                            (variant, vIndex) => (
                                <div
                                    key={vIndex}
                                    className="bg-slate-900/50 rounded-3xl p-6 mb-6"
                                >
                                    <div className="flex justify-between mb-5">
                                        <h3 className="font-bold text-xl">
                                            Variant{" "}
                                            {vIndex + 1}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeVariant(
                                                    vIndex
                                                )
                                            }
                                            className="bg-red-500 px-4 py-2 rounded-xl"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">

                                        <input
                                            value={variant.model}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].model = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Model"
                                            className="input"
                                        />

                                        <input
                                            value={variant.size}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].size = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Size"
                                            className="input"
                                        />

                                        <input
                                            value={variant.unit}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].unit = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Unit"
                                            className="input"
                                        />

                                        <input
                                            value={variant.packSize}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].packSize = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Pack Size"
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.minQuantity}
                                            onChange={(e) => {
                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex].minQuantity =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Min Quantity"
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.maxQuantity}
                                            onChange={(e) => {
                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex].maxQuantity =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Max Quantity"
                                            className="input"
                                        />

                                        <input
                                            type="number"
                                            value={variant.stepQuantity}
                                            onChange={(e) => {
                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex].stepQuantity =
                                                    e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Step Quantity"
                                            className="input"
                                        />

                                        <input
                                            value={variant.price}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].price = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Price"
                                            className="input"
                                        />

                                        <input
                                            value={variant.stockQuantity}
                                            onChange={(e) => {
                                                const updated = [...product.variants];
                                                updated[vIndex].stockQuantity = e.target.value;

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });
                                            }}
                                            placeholder="Stock Quantity"
                                            className="input"
                                        />

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {

                                                const updated =
                                                    [...product.variants];

                                                updated[vIndex].imageFile =
                                                    e.target.files[0];

                                                setProduct({
                                                    ...product,
                                                    variants: updated
                                                });

                                            }}
                                            className="input"
                                        />

                                    </div>

                                    <div className="mt-8">

                                        <div className="flex justify-between mb-4">
                                            <h4 className="font-semibold text-lg">
                                                Specifications
                                            </h4>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addSpecification(
                                                        vIndex
                                                    )
                                                }
                                                className="bg-green-600 px-4 py-2 rounded-xl"
                                            >
                                                + Add
                                            </button>
                                        </div>

                                        {variant.specifications.map(
                                            (
                                                spec,
                                                sIndex
                                            ) => (
                                                <div
                                                    key={sIndex}
                                                    className="grid md:grid-cols-3 gap-4 mb-4"
                                                >
                                                    <input
                                                        value={spec.key}
                                                        onChange={(e) => {
                                                            const updated = [...product.variants];

                                                            updated[vIndex]
                                                                .specifications[sIndex]
                                                                .key = e.target.value;

                                                            setProduct({
                                                                ...product,
                                                                variants: updated
                                                            });
                                                        }}
                                                        placeholder="Specification"
                                                        className="input"
                                                    />

                                                    <input
                                                        value={spec.value}
                                                        onChange={(e) => {
                                                            const updated = [...product.variants];

                                                            updated[vIndex]
                                                                .specifications[sIndex]
                                                                .value = e.target.value;

                                                            setProduct({
                                                                ...product,
                                                                variants: updated
                                                            });
                                                        }}
                                                        placeholder="Value"
                                                        className="input"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSpecification(
                                                                vIndex,
                                                                sIndex
                                                            )
                                                        }
                                                        className="bg-red-500 rounded-xl"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                        <div className="text-right mt-8">
                            <button
                                type="submit"
                                className="
        bg-gradient-to-r
        from-blue-500
        to-indigo-600
        px-8
        py-4
        rounded-2xl
        font-semibold
        text-white
      "
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    );
}