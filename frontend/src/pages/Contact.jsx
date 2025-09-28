export default function Contact() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-lg text-gray-600 text-center mb-6">
          Have questions or need assistance? Reach out to us anytime.
        </p>
        <div className="text-center space-y-4">
          <p className="text-gray-700">📧 Email Support</p>
          <a
            href="mailto:support@hyperlocalai.com"
            className="text-blue-600 hover:underline text-lg"
          >
            support@hyperlocalai.com
          </a>
        </div>
      </div>
    </div>
  );
}
