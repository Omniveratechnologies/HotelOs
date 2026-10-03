export const duplicateRecipe = async (apiBaseUrl, recipeId) => {
  const res = await fetch(
    `${apiBaseUrl}/inventory/recipes/${recipeId}/duplicate`,
    {
      method: "POST",
    },
  );
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to duplicate recipe");
  }

  return data.data;
};

export const saveRecipe = async (API_BASE_URL, id, form) => {
  const url = id
    ? `${API_BASE_URL}/inventory/recipes/${id}`
    : `${API_BASE_URL}/inventory/recipes`;

  console.log("Recipe URL:", url);
  console.log("Recipe payload:", form);

  const response = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Recipe API error:", response.status, text);
    throw new Error(`Recipe API failed: ${response.status}`);
  }

  const data = JSON.parse(text);

  return data.data || data;
};

export const fetchRecipe = async (apiBaseUrl, recipeId) => {
  const res = await fetch(`${apiBaseUrl}/inventory/recipes/${recipeId}`);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load recipe");
  }

  return data.data;
};

export const fetchInventoryItems = async (apiBaseUrl) => {
  const res = await fetch(`${apiBaseUrl}/inventory/items?limit=1000`);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load inventory items");
  }

  return Array.isArray(data.data) ? data.data : data.data.items || [];
};
