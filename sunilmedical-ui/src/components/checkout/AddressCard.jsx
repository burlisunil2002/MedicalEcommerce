export default function AddressCard({
    address,
    selected,
    onSelect,
    onEdit
}) {
    return (
        <div
            onClick={onSelect}
            className={`border rounded-2xl p-5 cursor-pointer transition ${selected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200"
                }`}
        >
            <div className="flex justify-between">

                <div>
                    <h3 className="font-semibold">
                        {address.fullName}
                    </h3>

                    <p>{address.addressLine1}</p>

                    <p>
                        {address.city}, {address.state}
                    </p>

                    <p>{address.pincode}</p>

                    <p>{address.mobileNumber}</p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(address);
                    }}
                    className="text-emerald-600 text-sm"
                >
                    Edit
                </button>

            </div>
        </div>
    );
}