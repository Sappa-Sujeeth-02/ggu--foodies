import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Refunds = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Cancellation & Refund Policy</h1>

                <div className="prose max-w-none bg-white p-6 rounded-lg shadow">
                    <h2>1. Order Cancellation</h2>
                    <p>
                        Orders can be cancelled within order is accepted by the food court. After this period, cancellations may not be possible as food preparation begins.
                    </p>

                    <h2>2. Refund Eligibility</h2>
                    <p>
                        Refunds are issued if:
                        <ul>
                            <li>We cancel your order due to unforeseen circumstances</li>
                            <li>You cancel within the allowed time frame</li>
                            <li>The order is significantly different from what was ordered</li>
                        </ul>
                    </p>

                    <h2>3. Refund Process</h2>
                    <p>
                        Approved refunds will be processed to the original payment method within 7-10 business days through Razorpay.
                    </p>

                    <h2>4. Non-Refundable Items</h2>
                    <p>
                        Prepared food items that cannot be resold are generally non-refundable unless there is an error on our part.
                    </p>

                    <h2>5. Disputes</h2>
                    <p>
                        For any payment disputes, please contact our support team at support@ggufoodies.com.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Refunds;