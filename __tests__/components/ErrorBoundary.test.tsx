import { FC } from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

// A child that throws while rendering - the exact shape of failure the old
// render-time try/catch in App.tsx could not catch (8.1.9a).
const Boom: FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("render exploded");
  }
  return <Text>alive</Text>;
};

describe("ErrorBoundary", () => {
  // React logs every caught render error to console.error; so does logger.error.
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders its children untouched while nothing throws", () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary renderFallback={() => <Text>fallback</Text>}>
        <Boom shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText("alive")).toBeTruthy();
    expect(queryByText("fallback")).toBeNull();
  });

  it("renders the fallback when a child throws during render", () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary renderFallback={() => <Text>fallback</Text>}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("fallback")).toBeTruthy();
    expect(queryByText("alive")).toBeNull();
  });

  it("hands the caught error to the fallback and to onError", () => {
    const onError = jest.fn();
    const { getByText } = render(
      <ErrorBoundary
        onError={onError}
        renderFallback={(error) => <Text>caught: {error.message}</Text>}
      >
        <Boom shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("caught: render exploded")).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe("render exploded");
  });

  it("re-renders the children after reset once they no longer throw", () => {
    // This is what the emergency screen's restore buttons rely on: they put a
    // usable state back, then call reset to leave the crash screen.
    const Harness: FC = () => {
      let breakIt = true;
      const Child: FC = () => {
        if (breakIt) {
          throw new Error("render exploded");
        }
        return <Text>alive</Text>;
      };
      return (
        <ErrorBoundary
          renderFallback={(_error, reset) => (
            <Text
              onPress={() => {
                breakIt = false;
                reset();
              }}
            >
              recover
            </Text>
          )}
        >
          <Child />
        </ErrorBoundary>
      );
    };
    const { getByText, queryByText } = render(<Harness />);

    expect(getByText("recover")).toBeTruthy();
    fireEvent.press(getByText("recover"));
    expect(getByText("alive")).toBeTruthy();
    expect(queryByText("recover")).toBeNull();
  });
});
