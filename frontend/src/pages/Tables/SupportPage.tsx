// src/SupportPage.jsx
// import React from "react";

const SupportPage = () => {
  const support = {
    phone: "7974607011",
    whatsapp: "7974607011",
    email: "info@arthaai.in",
    facebook: "facebook.com/yourpage",
    youtube: "youtube.com/@yourchannel",
    instagram: "instagram.com/yourprofile",
    twitter: "twitter.com/yourprofile",
    linkedin: "linkedin.com/in/yourprofile",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-6">
      {/* Main Area */}
      <div className="w-full max-w-7xl mx-auto">
        {/* Content */}
        <main className="bg-white rounded-3xl shadow-lg border border-slate-200 p-14">
          <h1 className="text-5xl font-bold text-slate-900 mb-14 text-center">
            Support
          </h1>
          <ul className="space-y-10 text-xl">
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">📞</span>
                <span>Phone Support:</span>
              </div>
              <span className="font-semibold text-lg">{support.phone}</span>
            </li>
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">💬</span>
                <span>WhatsApp Support:</span>
              </div>
              <span className="font-semibold text-lg">{support.whatsapp}</span>
            </li>
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">✉️</span>
                <span>Email Support:</span>
              </div>
              <span className="font-semibold text-lg">{support.email}</span>
            </li>
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">📘</span>
                <span>Facebook:</span>
              </div>
              <span className="font-semibold text-lg">{support.facebook}</span>
            </li>
           
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">📷</span>
                <span>Instagram:</span>
              </div>
              <span className="font-semibold text-lg">{support.instagram}</span>
            </li>
            <li className="flex items-center justify-between  bg-slate-50 rounded-xl text-slate-700">
              <div className="flex items-center gap-5">
                <span className="text-4xl">🐦</span>
                <span>Twitter:</span>
              </div>
              <span className="font-semibold text-lg">{support.twitter}</span>
            </li>
            
          </ul>
        </main>
      </div>
    </div>
  );
};

export default SupportPage;
