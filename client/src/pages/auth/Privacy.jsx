import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Privacy Policy</h1>

                <div className="prose max-w-none bg-white p-6 rounded-lg shadow">
                    <h2>1. Information Collection</h2>
                    <p>
                        We collect personal information when you register, place orders, or interact with our services. This includes name, contact details, and payment information processed through Razorpay.
                    </p>

                    <h2>2. Use of Information</h2>
                    <p>
                        Your information is used to process orders, improve services, and communicate with you. Payment details are securely processed by Razorpay and not stored on our servers.
                    </p>

                    <h2>3. Data Security</h2>
                    <p>
                        We implement security measures to protect your data. All transactions are encrypted using SSL technology.
                    </p>

                    <h2>4. Third-Party Services</h2>
                    <p>
                        We use Razorpay for payment processing. Their privacy policy governs the handling of your payment information.
                    </p>

                    <h2>5. Changes to Policy</h2>
                    <p>
                        We may update this policy periodically. Continued use of our services constitutes acceptance of the revised policy.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Privacy;