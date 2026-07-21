export default function StatusBadge({ status }) {

    const styles = {

        Requested:
            "bg-yellow-100 text-yellow-800",

        Approved:
            "bg-blue-100 text-blue-800",

        Rejected:
            "bg-red-100 text-red-800",

        PickupScheduled:
            "bg-purple-100 text-purple-800",

        PickedUp:
            "bg-indigo-100 text-indigo-800",

        RefundInitiated:
            "bg-orange-100 text-orange-800",

        RefundCompleted:
            "bg-green-100 text-green-800"

    };

    return (

        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"
                }`}
        >
            {status}
        </span>

    );

}