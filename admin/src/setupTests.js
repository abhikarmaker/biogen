import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver, which recharts' ResponsiveContainer needs.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
