export default function CategorySkeleton() {

    return (

        <div className="flex gap-3 mt-6 overflow-hidden">

            {Array.from({ length: 8 }).map((_, index) => (

                <div
                    key={index}
                    className="skeleton h-10 w-32 rounded-full flex-shrink-0"
                />

            ))}

        </div>

    );

}