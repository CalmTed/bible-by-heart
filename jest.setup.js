jest.mock("expo-dev-menu", () => ({}));
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(false))
}));


jest.mock("react-native/Libraries/Vibration/Vibration", () => ({
  vibrate: jest.fn()
}));

jest.mock("expo-task-manager", () => ({}));

