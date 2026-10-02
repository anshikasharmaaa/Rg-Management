import Header from "../shared/Header.jsx";
import Footer from "./Footer.jsx";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const contactDetails = [
    { icon: MapPin, label: "Address", value: "Your Restaurant Address Here" },
    { icon: Phone, label: "Phone", value: "+91 00000 00000" },
    { icon: Mail, label: "Email", value: "hello@rgrestaurant.com" },
    { icon: Clock, label: "Hours", value: "Mon – Sun, 11:00 AM – 11:00 PM" },
];

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="border-b border-gray-200 bg-gold-50/50 py-14 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                    Get in Touch
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Contact Us</h1>
                <p className="mx-auto mt-3 max-w-xl px-4 text-sm text-gray-500">
                    We'd love to have you. Reach out with questions, feedback or reservations.
                </p>
            </div>

            <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {contactDetails.map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-card"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    {label}
                                </p>
                                <p className="mt-1 text-sm text-gray-900">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactPage;