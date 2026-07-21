export default function ProductCardSkeleton() {

    return (

        <div className="bg-white rounded-2xl shadow-sm p-3">

            <div className="skeleton aspect-square rounded-xl"></div>

            <div className="mt-4 space-y-3">

                <div className="skeleton h-4 w-full rounded"></div>

                <div className="skeleton h-4 w-3/4 rounded"></div>

                <div className="skeleton h-6 w-24 rounded"></div>

                <div className="skeleton h-10 rounded-xl"></div>

            </div>

        </div>

    );

}