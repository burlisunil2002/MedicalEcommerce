import React from "react";

export default function BasicInfoSection({
    product,
    handleChange,
    errors
}) {

    const inputClass = (field) =>
        `
        w-full
        rounded-xl
        border
        px-4
        py-3
        outline-none
        transition-all
        duration-200
        bg-white

        ${errors[field]
            ? "border-red-500 ring-2 ring-red-200"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }
    `;

    return (

        <div
            className="
            bg-white
            rounded-3xl
            shadow-lg
            p-8
            mb-8
        "
        >

            {/* Heading */}

            <div className="mb-8">

                <h2
                    className="
                    text-2xl
                    font-bold
                    text-gray-800
                "
                >
                    Product Information
                </h2>

                <p
                    className="
                    text-gray-500
                    mt-1
                "
                >
                    Enter the basic information about your product.
                </p>

            </div>

            <div
                className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
            "
            >

                {/* Product Name */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                        "
                    >
                        Product/Item Name
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        placeholder="Enter Product Name"
                        className={inputClass("name")}
                    />

                    {errors.name && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.name}
                        </p>

                    )}

                </div>

                {/* Brand */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                    "
                    >
                        Brand
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <input
                        type="text"
                        name="brand"
                        value={product.brand}
                        onChange={handleChange}
                        placeholder="Enter Brand"
                        className={inputClass("brand")}
                    />

                    {errors.brand && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.brand}
                        </p>

                    )}

                </div>

                {/* Category */}

                <div>
                    <label
                        className="
            block
            mb-2
            text-sm
            font-semibold
            text-gray-700
        "
                    >
                        Category
                        <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                        <select
                            name="category"
                            value={product.category || ""}
                            onChange={handleChange}
                            className={`
                ${inputClass("category")}
                w-full
                appearance-none
                cursor-pointer
                bg-white
                pr-11
            `}
                        >
                            <option value="" disabled>
                                Select a medical product category
                            </option>

                            {/* Medical Consumables */}
                            <optgroup label="Medical Consumables">
                                <option value="Medical Consumables">
                                    Medical Consumables
                                </option>
                                <option value="Syringes & Needles">
                                    Syringes & Needles
                                </option>
                                <option value="IV & Infusion Products">
                                    IV & Infusion Products
                                </option>
                                <option value="Blood Collection Products">
                                    Blood Collection Products
                                </option>
                                <option value="Specimen Collection">
                                    Specimen Collection
                                </option>
                                <option value="Catheters & Tubes">
                                    Catheters & Tubes
                                </option>
                                <option value="Gauze & Dressings">
                                    Gauze & Dressings
                                </option>
                                <option value="Bandages & Wound Care">
                                    Bandages & Wound Care
                                </option>
                                <option value="Medical Tapes">
                                    Medical Tapes
                                </option>
                                <option value="Surgical Gloves">
                                    Surgical Gloves
                                </option>
                                <option value="Examination Gloves">
                                    Examination Gloves
                                </option>
                                <option value="Masks & Respiratory Disposables">
                                    Masks & Respiratory Disposables
                                </option>
                                <option value="Protective Apparel">
                                    Protective Apparel
                                </option>
                            </optgroup>

                            {/* Surgical */}
                            <optgroup label="Surgical & Operation Theatre">
                                <option value="Surgical Instruments">
                                    Surgical Instruments
                                </option>
                                <option value="Surgical Disposables">
                                    Surgical Disposables
                                </option>
                                <option value="Operation Theatre Supplies">
                                    Operation Theatre Supplies
                                </option>
                                <option value="Sutures & Staplers">
                                    Sutures & Staplers
                                </option>
                                <option value="Electrosurgical Products">
                                    Electrosurgical Products
                                </option>
                                <option value="Sterilization Products">
                                    Sterilization Products
                                </option>
                            </optgroup>

                            {/* Diagnostic */}
                            <optgroup label="Diagnostic & Monitoring">
                                <option value="Patient Monitoring">
                                    Patient Monitoring
                                </option>
                                <option value="Vital Signs Monitoring">
                                    Vital Signs Monitoring
                                </option>
                                <option value="Blood Pressure Monitors">
                                    Blood Pressure Monitors
                                </option>
                                <option value="Pulse Oximeters">
                                    Pulse Oximeters
                                </option>
                                <option value="ECG & Cardiac Monitoring">
                                    ECG & Cardiac Monitoring
                                </option>
                                <option value="Diagnostic Instruments">
                                    Diagnostic Instruments
                                </option>
                                <option value="Thermometers">
                                    Thermometers
                                </option>
                                <option value="Stethoscopes">
                                    Stethoscopes
                                </option>
                            </optgroup>

                            {/* Laboratory */}
                            <optgroup label="Laboratory & Pathology">
                                <option value="Laboratory Equipment">
                                    Laboratory Equipment
                                </option>
                                <option value="Laboratory Consumables">
                                    Laboratory Consumables
                                </option>
                                <option value="Laboratory Glassware">
                                    Laboratory Glassware
                                </option>
                                <option value="Blood Collection Tubes">
                                    Blood Collection Tubes
                                </option>
                                <option value="Centrifuges">
                                    Centrifuges
                                </option>
                                <option value="Microscopes">
                                    Microscopes
                                </option>
                                <option value="Diagnostic Kits">
                                    Diagnostic Kits
                                </option>
                                <option value="Laboratory Safety Products">
                                    Laboratory Safety Products
                                </option>
                            </optgroup>

                            {/* Imaging */}
                            <optgroup label="Medical Imaging">
                                <option value="X-Ray Equipment">
                                    X-Ray Equipment
                                </option>
                                <option value="Ultrasound Equipment">
                                    Ultrasound Equipment
                                </option>
                                <option value="MRI Equipment">
                                    MRI Equipment
                                </option>
                                <option value="CT Scan Equipment">
                                    CT Scan Equipment
                                </option>
                                <option value="Imaging Accessories">
                                    Imaging Accessories
                                </option>
                                <option value="Radiology Consumables">
                                    Radiology Consumables
                                </option>
                            </optgroup>

                            {/* ICU */}
                            <optgroup label="ICU & Critical Care">
                                <option value="ICU Equipment">
                                    ICU Equipment
                                </option>
                                <option value="Ventilators">
                                    Ventilators
                                </option>
                                <option value="Infusion Pumps">
                                    Infusion Pumps
                                </option>
                                <option value="Syringe Pumps">
                                    Syringe Pumps
                                </option>
                                <option value="Patient Care Equipment">
                                    Patient Care Equipment
                                </option>
                                <option value="Critical Care Consumables">
                                    Critical Care Consumables
                                </option>
                            </optgroup>

                            {/* Respiratory */}
                            <optgroup label="Respiratory Care">
                                <option value="Oxygen Therapy">
                                    Oxygen Therapy
                                </option>
                                <option value="Nebulizers">
                                    Nebulizers
                                </option>
                                <option value="CPAP & BiPAP">
                                    CPAP & BiPAP
                                </option>
                                <option value="Respiratory Consumables">
                                    Respiratory Consumables
                                </option>
                                <option value="Oxygen Accessories">
                                    Oxygen Accessories
                                </option>
                            </optgroup>

                            {/* Orthopedic */}
                            <optgroup label="Orthopedic & Rehabilitation">
                                <option value="Orthopedic Products">
                                    Orthopedic Products
                                </option>
                                <option value="Orthopedic Supports">
                                    Orthopedic Supports
                                </option>
                                <option value="Braces & Supports">
                                    Braces & Supports
                                </option>
                                <option value="Mobility Aids">
                                    Mobility Aids
                                </option>
                                <option value="Rehabilitation Equipment">
                                    Rehabilitation Equipment
                                </option>
                                <option value="Physiotherapy Equipment">
                                    Physiotherapy Equipment
                                </option>
                            </optgroup>

                            {/* Hospital Equipment */}
                            <optgroup label="Hospital Equipment">
                                <option value="Hospital Beds">
                                    Hospital Beds
                                </option>
                                <option value="Patient Trolleys">
                                    Patient Trolleys
                                </option>
                                <option value="Wheelchairs">
                                    Wheelchairs
                                </option>
                                <option value="Examination Tables">
                                    Examination Tables
                                </option>
                                <option value="Hospital Furniture">
                                    Hospital Furniture
                                </option>
                                <option value="Medical Carts & Cabinets">
                                    Medical Carts & Cabinets
                                </option>
                            </optgroup>

                            {/* Emergency */}
                            <optgroup label="Emergency & First Aid">
                                <option value="Emergency Equipment">
                                    Emergency Equipment
                                </option>
                                <option value="First Aid Products">
                                    First Aid Products
                                </option>
                                <option value="CPR Equipment">
                                    CPR Equipment
                                </option>
                                <option value="Emergency Kits">
                                    Emergency Kits
                                </option>
                            </optgroup>

                            {/* Dental */}
                            <optgroup label="Dental">
                                <option value="Dental Equipment">
                                    Dental Equipment
                                </option>
                                <option value="Dental Instruments">
                                    Dental Instruments
                                </option>
                                <option value="Dental Consumables">
                                    Dental Consumables
                                </option>
                                <option value="Dental Disposables">
                                    Dental Disposables
                                </option>
                            </optgroup>

                            {/* Infection Control */}
                            <optgroup label="Infection Control & Hygiene">
                                <option value="Disinfectants & Sanitization">
                                    Disinfectants & Sanitization
                                </option>
                                <option value="Infection Control Products">
                                    Infection Control Products
                                </option>
                                <option value="PPE">
                                    PPE
                                </option>
                                <option value="Medical Hygiene Products">
                                    Medical Hygiene Products
                                </option>
                            </optgroup>

                            {/* Home Healthcare */}
                            <optgroup label="Home Healthcare">
                                <option value="Home Healthcare Equipment">
                                    Home Healthcare Equipment
                                </option>
                                <option value="Home Monitoring">
                                    Home Monitoring
                                </option>
                                <option value="Personal Care Medical Devices">
                                    Personal Care Medical Devices
                                </option>
                            </optgroup>

                            {/* Other */}
                            <optgroup label="Other">
                                <option value="Medical Accessories">
                                    Medical Accessories
                                </option>
                                <option value="Medical Equipment Accessories">
                                    Medical Equipment Accessories
                                </option>
                                <option value="Other Medical Products">
                                    Other Medical Products
                                </option>
                            </optgroup>
                        </select>

                        {/* Dropdown Arrow */}
                        <div
                            className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-gray-400
            "
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>

                    {errors.category && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            {errors.category}
                        </p>
                    )}
                </div>

                {/* Price Type */}

                <div>

                    <label
                        className="
                        block
                        mb-2
                        font-semibold
                        text-gray-700
                    "
                    >
                        Price Type
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <select
                        name="priceType"
                        value={product.priceType}
                        onChange={handleChange}
                        className={inputClass("priceType")}
                    >

                        <option value="Normal">
                            Normal
                        </option>

                        <option value="Ask For Price">
                            Ask For Price
                        </option>

                    </select>

                    {errors.priceType && (

                        <p
                            className="
                            mt-2
                            text-sm
                            text-red-600
                        "
                        >
                            {errors.priceType}
                        </p>

                    )}

                </div>

            </div>

            {/* Description */}

            <div className="mt-6">

                <label
                    className="
                    block
                    mb-2
                    font-semibold
                    text-gray-700
                "
                >
                    Description
                    <span className="text-red-500 ml-1">*</span>
                </label>

                <textarea
                    rows={6}
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    placeholder="Enter Product Description..."
                    className={inputClass("description")}
                />

                {errors.description && (

                    <p
                        className="
                        mt-2
                        text-sm
                        text-red-600
                    "
                    >
                        {errors.description}
                    </p>

                )}

            </div>

        </div>

    );

}