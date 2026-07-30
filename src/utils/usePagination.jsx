import { useState, useMemo } from 'react';

/**
 * Hook untuk paginasi.
 * @param {Array} data - Array data utuh (yang sudah difilter/disortir)
 * @param {number|string} defaultItemsPerPage - Jumlah item per halaman standar
 */
export function usePagination(data, defaultItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const numericLimit = itemsPerPage === 'all' ? data.length : Number(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(data.length / (numericLimit || 1)));

  // Pastikan currentPage tidak melebihi totalPages setelah filter berubah
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  if (currentPage !== safeCurrentPage) {
    setCurrentPage(safeCurrentPage);
  }

  const paginatedData = useMemo(() => {
    if (itemsPerPage === 'all') return data;
    const startIndex = (safeCurrentPage - 1) * numericLimit;
    return data.slice(startIndex, startIndex + numericLimit);
  }, [data, safeCurrentPage, itemsPerPage, numericLimit]);

  const handleSetItemsPerPage = (val) => {
    setItemsPerPage(val === 'all' ? 'all' : Number(val));
    setCurrentPage(1);
  };

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage
  };
}
