export const getDiscounts = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/discounts?${query}`);
    if (!response.ok) throw new Error('Failed to fetch discounts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
};

export const createDiscount = async (discountData) => {
  try {
    const response = await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discountData)
    });
    if (!response.ok) throw new Error('Failed to create discount');
    return await response.json();
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
};

export const updateDiscount = async (discountId, discountData) => {
  try {
    const response = await fetch(`/api/discounts/${discountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discountData)
    });
    if (!response.ok) throw new Error('Failed to update discount');
    return await response.json();
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
};

export const deleteDiscount = async (discountId) => {
  try {
    const response = await fetch(`/api/discounts/${discountId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete discount');
    return true;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
};

