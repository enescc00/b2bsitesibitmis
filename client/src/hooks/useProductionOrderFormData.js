import { useState } from "react";

export const useProductionOrderFormData = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const update = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return { formData, update, setFormData };
};
