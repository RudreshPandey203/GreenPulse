"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EMISSION_FACTORS } from "@/constants/emissions";

export default function AddEmissionForm({ userId }) {
  const [category, setCategory] = useState("travel");
  const [subCategory, setSubCategory] = useState("car");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value || parseFloat(value) <= 0) {
      setMessage("Enter a valid number.");
      return;
    }
    setIsLoading(true);

    try {
      let co2 = 0;
      let description = "";

      if (category === "travel") {
        co2 = parseFloat(value) * EMISSION_FACTORS.travel[subCategory];
        description = `${subCategory} trip: ${value} km`;
      } else if (category === "home") {
        co2 = parseFloat(value) * EMISSION_FACTORS.home.electricity;
        description = `Electricity: ${value} kWh`;
      } else if (category === "food") {
        co2 = EMISSION_FACTORS.food[subCategory];
        description = `Diet: ${subCategory}`;
      }

      const emissionsCollection = collection(
        db,
        `/artifacts/default-app-id/users/${userId}/emissions`
      );

      await addDoc(emissionsCollection, {
        category,
        subCategory,
        value: parseFloat(value),
        co2: parseFloat(co2.toFixed(2)),
        description,
        createdAt: serverTimestamp(),
      });

      setMessage(`✅ Added ${co2.toFixed(2)} kg CO₂`);
      setValue("");
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Failed to add emission.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Log a Green Activity
      </h2>
      <form onSubmit={handleSubmit}>
        {/* category buttons, input fields (same as your code) */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg"
        >
          {isLoading ? "Adding..." : "Add Emission"}
        </button>
        {message && (
          <p className="text-center mt-2 text-sm">{message}</p>
        )}
      </form>
    </div>
  );
}
