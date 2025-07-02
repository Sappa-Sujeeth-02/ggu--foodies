import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Terms = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Terms and Conditions</h1>

                <div className="prose max-w-none bg-white p-6 rounded-lg shadow">
                    <h2>1. General Terms</h2>
                    <p>
                        By accessing and using GGU Foodies, you accept and agree to be bound by these Terms and Conditions.
                    </p>

                    <h2>2. Orders and Payments</h2>
                    <p>
                        All orders are processed through Razorpay payment gateway. We accept various payment methods including credit/debit cards, net banking, UPI, and wallets.
                    </p>

                    <h2>3. Refund Policy</h2>
                    <p>
                        Refunds, if applicable, will be processed to the original payment method within 7-10 business days.
                    </p>

                    <h2>4. User Responsibilities</h2>
                    <p>
                        You agree to provide accurate information when placing orders and to comply with all applicable laws.
                    </p>

                    <h2>5. Limitation of Liability</h2>
                    <p>
                        GGU Foodies shall not be liable for any indirect, incidental, or consequential damages arising from the use of our service.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Terms;