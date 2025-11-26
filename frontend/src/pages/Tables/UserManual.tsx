import React, { useState } from "react";
import { 
  FaBook, 
  FaRocket, 
  FaShoppingCart, 
  FaChartBar, 
  FaWallet, 
  FaShieldAlt, 
  FaHeadset,
  // FaSearch,
  FaChevronDown,
  FaEnvelope,
  FaQuestionCircle,
  FaVideo
} from "react-icons/fa";

const userManualData = [
  {
    title: "Introduction",
    icon: FaBook,
    content: [
      "Welcome to [Your Platform Name]! This guide will help you navigate the platform and trade efficiently."
    ]
  },
  {
    title: "Getting Started",
    icon: FaRocket,
    content: [
      "Login using your credentials.",
      "Navigate the dashboard to view orders, positions, and account summary.",
      "Sidebar provides quick access to all modules."
    ]
  },
  {
    title: "Placing Orders",
    icon: FaShoppingCart,
    content: [
      "Order Types: Market, Limit, Stop-loss.",
      "Products: MIS (Intraday), CNC (Delivery).",
      "Varieties: Regular, AMO (After Market Order), CO (Cover Order), Iceberg.",
      "To buy/sell: Select symbol → Quantity → Product → Order Type → Place Order."
    ]
  },
  {
    title: "Viewing Orders & Positions",
    icon: FaChartBar,
    content: [
      "Current Positions: Track your live positions.",
      "Holdings: Details of stocks you own.",
      "Order History: View past orders and trades."
    ]
  },
  {
    title: "Account & Funds",
    icon: FaWallet,
    content: [
      "Check your available balance before placing orders.",
      "Understand blocked margin for active positions."
    ]
  },
  {
    title: "Trading Tips & Safety",
    icon: FaShieldAlt,
    content: [
      "Trade responsibly and manage risks.",
      "Never invest more than you can afford to lose."
    ]
  },
  {
    title: "Support",
    icon: FaHeadset,
    content: [
      "For assistance, contact support at support@example.com.",
      "Check FAQs for common issues."
    ]
  }
];

const UserManual: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]) // Expand first section by default
  );

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-100 rounded-2xl p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            User Manual
          </h1>
          <p className="text-gray-600 text-lg">
            Everything you need to know to trade effectively on our platform
          </p>
        </div>

        {/* Manual Sections */}
        <div className="space-y-4">
          {userManualData.map((section, idx) => {
            const IconComponent = section.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl">
                      <IconComponent className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaChevronDown
                      className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                        expandedSections.has(idx) ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {expandedSections.has(idx) && (
                  <div className="px-6 pb-5">
                    <div className="pl-14">
                      <ul className="space-y-3">
                        {section.content.map((item, index) => (
                          <li
                            key={index}
                            className="text-gray-700 leading-relaxed flex items-start"
                          >
                            <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-orange-300 transition-colors duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FaEnvelope className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Contact Support</h3>
            <p className="text-gray-600 text-sm">Get help from our support team</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-orange-300 transition-colors duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FaQuestionCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">FAQs</h3>
            <p className="text-gray-600 text-sm">Find answers to common questions</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-orange-300 transition-colors duration-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FaVideo className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Video Tutorials</h3>
            <p className="text-gray-600 text-sm">Watch step-by-step guides</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserManual;