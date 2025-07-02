import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Shipping = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Order & Pickup Policy</h1>

                <div className="prose max-w-none bg-white p-6 rounded-lg shadow">
                    <h2>1. Order Options</h2>
                    <p>
                        GGU Foodies offers two convenient service options:
                    </p>
                    <ul>
                        <li><strong>Dine-in:</strong> Pre-order and eat at the food court</li>
                        <li><strong>Takeaway:</strong> Pre-order and pick up your food to go</li>
                    </ul>

                    <h2>2. Pre-Order System</h2>
                    <p>
                        Our platform allows you to pre-order meals from GGU food courts to avoid waiting:
                    </p>
                    <ul>
                        <li>Place orders anytime through our app/website</li>
                        <li>Specify your preferred pickup time</li>
                        <li>Orders can be placed up to 24 hours in advance</li>
                    </ul>

                    <h2>3. Preparation & Pickup Times</h2>
                    <p>
                        Standard preparation times:
                    </p>
                    <ul>
                        <li>Regular orders: 20-30 minutes during operational hours (9 AM - 9 PM)</li>
                        <li>Large/complex orders: 40-50 minutes (you'll be notified if additional time is needed)</li>
                    </ul>

                    <h2>4. Order Notifications</h2>
                    <p>
                        You will receive SMS notifications about your order status:
                    </p>
                    <ul>
                        <li>Order confirmation</li>
                        <li>When your order is being prepared</li>
                        <li>When your order is ready for pickup</li>
                        <li>Reminder if order isn't picked up within 15 minutes of readiness</li>
                    </ul>

                    <h2>5. Pickup Policy</h2>
                    <p>
                        Important pickup information:
                    </p>
                    <ul>
                        <li>Present your order confirmation (digital or printed) when picking up</li>
                        <li>Orders must be picked up within 30 minutes of readiness notification</li>
                        <li>Unclaimed orders after 30 minutes may be discarded with no refund</li>
                    </ul>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Shipping;