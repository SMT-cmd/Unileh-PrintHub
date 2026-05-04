global.window = {};

require("../assets/js/pricing.js");

const calc = window.printPricing.calculatePrintTotal;

const bw = (pagesInFile, copies) =>
  calc({ printType: "B&W", pagesInFile, copies }).total;
const color = (pagesInFile, copies) =>
  calc({ printType: "Color", pagesInFile, copies }).total;

const assertEq = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
};

assertEq(bw(1, 1), 80, "B/W 1 page");
assertEq(bw(2, 1), 150, "B/W 2 pages");
assertEq(bw(3, 1), 230, "B/W 3 pages");
assertEq(bw(2, 2), 300, "B/W 4 pages");
assertEq(bw(1, 5), 380, "B/W 5 pages");

assertEq(color(1, 1), 100, "Color 1 page");
assertEq(color(3, 2), 600, "Color 6 pages");

process.stdout.write("ok\n");
