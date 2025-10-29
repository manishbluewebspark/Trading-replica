import { useEffect, useState } from "react";
import { termsData, Section } from "../data/Form";

export default function Terms() {
  const [checked, setChecked] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    // Check if SignUpForm's checkbox was selected
    const mainAccepted = JSON.parse(localStorage.getItem("termsAccepted") || "false");
    if (mainAccepted) {
      // Auto-select all checkboxes
      const allChecked: { [key: string]: boolean } = {};
      termsData.forEach((section) => {
        allChecked[section.id] = true;
      });
      setChecked(allChecked);
    }
  }, []);

  const handleCheckboxChange = (id: string) => {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Welcome to Share Market Private Limited
      </h1>

      <form className="space-y-6">
        {termsData.map((section: Section) => (
          <div key={section.id} className="border p-4 rounded">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!checked[section.id]}
                onChange={() => handleCheckboxChange(section.id)}
                className="mt-1"
              />
              <span>
                <strong className="text-lg">{section.title}</strong>
                <p className="mt-1 text-gray-700 whitespace-pre-line">
                  {section.content}
                </p>
              </span>
            </label>
          </div>
        ))}
      </form>
    </div>
  );
}
