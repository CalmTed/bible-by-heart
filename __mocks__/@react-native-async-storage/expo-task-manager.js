module.exports = {
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
  unregisterTaskAsync: jest.fn(),
};