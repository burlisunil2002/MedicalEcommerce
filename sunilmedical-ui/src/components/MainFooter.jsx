export default function MainFooter() {
    return (
        <footer className="bg-black text-gray-400 mt-16">

            <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">

                <div>
                    <h2 className="text-white text-lg font-semibold">
                        Sunil Medical
                    </h2>
                    <p className="text-sm mt-2">
                        India's trusted medical equipment store.
                    </p>
                </div>

                <div>
                    <h3 className="text-white font-semibold">Shop</h3>
                    <ul className="space-y-2 text-sm">
                        <li><a href="/">Products</a></li>
                        <li><a href="/Cart">Cart</a></li>
                        <li><a href="/Wishlist">Wishlist</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold">Help</h3>
                    <ul className="space-y-2 text-sm">
                        <li>Contact</li>
                        <li>Support</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold">Connect</h3>
                    <p className="text-sm">📞 +91 9014060858</p>
                </div>

            </div>

            <div className="text-center py-4 border-t border-gray-800 text-sm">
                © {new Date().getFullYear()} Sunil Medical
            </div>

        </footer>
    );
}