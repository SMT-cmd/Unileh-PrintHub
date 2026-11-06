(function () {
  function toPosInt(value, fallback) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
  }

  function calculateBwBundle(totalPagesPrinted) {
    const n = Math.max(0, Math.floor(Number(totalPagesPrinted) || 0));
    const pairs = Math.floor(n / 2);
    const remainder = n % 2;
    return {
      total: pairs * 150 + remainder * 80,
      pairs,
      remainder
    };
  }

  function calculateColor(totalPagesPrinted) {
    const n = Math.max(0, Math.floor(Number(totalPagesPrinted) || 0));
    return { total: n * 100, pages: n };
  }

  function calculatePrintTotal({ printType, pagesInFile, copies }) {
    const pages = toPosInt(pagesInFile, 1);
    const cps = toPosInt(copies, 1);
    const totalPagesPrinted = pages * cps;

    if (String(printType).toLowerCase() === "color") {
      const result = calculateColor(totalPagesPrinted);
      return {
        total: result.total,
        totalPagesPrinted,
        breakdownLabel: `₦100 × ${totalPagesPrinted} page${totalPagesPrinted === 1 ? "" : "s"}`
      };
    }

    const result = calculateBwBundle(totalPagesPrinted);
    const bundleLabel =
      result.pairs > 0
        ? `(${result.pairs} × ₦150 bundle${result.pairs === 1 ? "" : "s"}${
            result.remainder ? ` + ₦80` : ""
          })`
        : `₦80`;

    return {
      total: result.total,
      totalPagesPrinted,
      breakdownLabel: `${bundleLabel} for ${totalPagesPrinted} page${
        totalPagesPrinted === 1 ? "" : "s"
      }`
    };
  }

  window.printPricing = {
    calculatePrintTotal
  };
})();
