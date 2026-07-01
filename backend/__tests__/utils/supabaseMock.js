// Chainable Supabase client stub. Each `.single()` resolves the next queued
// result, in the order the code under test calls it — push results in that
// same order before making the request.
function createSupabaseMock() {
  const queue = [];
  const chain = {};

  ['from', 'select', 'eq', 'order', 'update', 'delete', 'insert', 'upsert'].forEach((method) => {
    chain[method] = jest.fn(() => chain);
  });

  chain.single = jest.fn(() => Promise.resolve(queue.length ? queue.shift() : { data: null, error: null }));
  chain.rpc = jest.fn(() => Promise.resolve({ data: null, error: null }));
  chain.__push = (result) => queue.push(result);
  chain.__reset = () => {
    queue.length = 0;
    Object.values(chain).forEach((fn) => fn.mockClear?.());
  };

  return chain;
}

module.exports = { createSupabaseMock };
