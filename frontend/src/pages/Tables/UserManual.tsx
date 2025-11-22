import React from "react";

const userManualData = [
  {
    title: "Introduction",
    content: [
      "Welcome to [Your Platform Name]! This guide will help you navigate the platform and trade efficiently."
    ]
  },
  {
    title: "Getting Started",
    content: [
      "Login using your credentials.",
      "Navigate the dashboard to view orders, positions, and account summary.",
      "Sidebar provides quick access to all modules."
    ]
  },
  {
    title: "Placing Orders",
    content: [
      "Order Types: Market, Limit, Stop-loss.",
      "Products: MIS (Intraday), CNC (Delivery).",
      "Varieties: Regular, AMO (After Market Order), CO (Cover Order), Iceberg.",
      "To buy/sell: Select symbol → Quantity → Product → Order Type → Place Order."
    ]
  },
  {
    title: "Viewing Orders & Positions",
    content: [
      "Current Positions: Track your live positions.",
      "Holdings: Details of stocks you own.",
      "Order History: View past orders and trades."
    ]
  },
  {
    title: "Account & Funds",
    content: [
      "Check your available balance before placing orders.",
      "Understand blocked margin for active positions."
    ]
  },
  {
    title: "Trading Tips & Safety",
    content: [
      "Trade responsibly and manage risks.",
      "Never invest more than you can afford to lose."
    ]
  },
  {
    title: "Support",
    content: [
      "For assistance, contact support at support@example.com.",
      "Check FAQs for common issues."
    ]
  }
];

const UserManual: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Manual</h1>
      {userManualData.map((section, idx) => (
        <div key={idx} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
          <ul className="list-disc list-inside space-y-1">
            {section.content.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default UserManual;
