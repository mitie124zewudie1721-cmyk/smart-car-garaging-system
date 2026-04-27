// src/components/WhyChooseSection.tsx
import { Clock, CreditCard, Shield } from 'lucide-react';

const features = [
  {
    icon: <Clock className="w-10 h-10" />,
    title: "Real-Time Availability",
    description: "See available spots instantly with live updates from smart sensors.",
    backTitle: "How it Works",
    backText: "Our IoT sensors update every 5 seconds. You always see the latest available parking spaces in real time.",
  },
  {
    icon: <CreditCard className="w-10 h-10" />,
    title: "Secure Payments",
    description: "Pay easily with mobile money, card or digital wallets — no cash needed.",
    backTitle: "Multiple Payment Options",
    backText: "We support TeleBirr, CBE Birr, M-Birr, Visa, Mastercard and digital wallets. All transactions are encrypted.",
  },
  {
    icon: <Shield className="w-10 h-10" />,
    title: "Safe & Monitored",
    description: "CCTV, secure gates, and 24/7 monitoring for complete peace of mind.",
    backTitle: "Security Features",
    backText: "24/7 CCTV surveillance, automatic gates, motion sensors, and security guards ensure your vehicle is always protected.",
  },
];

export default function WhyChooseSection() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Why Choose Smart Garaging?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need for hassle-free, secure, and smart parking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group perspective-1000"
            >
              <div className="relative w-full h-[380px] transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">

                {/* Front Side */}
                <div className="absolute inset-0 bg-gray-900 border border-gray-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center backface-hidden">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                  <h4 className="text-2xl font-bold text-white mb-6">
                    {feature.backTitle}
                  </h4>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    {feature.backText}
                  </p>
                  <div className="mt-8 w-12 h-1 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}