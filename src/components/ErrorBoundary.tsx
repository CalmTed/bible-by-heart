import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "../utils/logger";

interface ErrorBoundaryModel {
  children: ReactNode;
  // Rendered instead of the children once something below has thrown. `reset`
  // clears the caught error so the children get another chance - the recovery
  // buttons call it after they have put a usable state back.
  renderFallback: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryStateModel {
  error: Error | null;
}

/**
 * The only way to catch a render error thrown by a child.
 *
 * App.tsx used to wrap its `return (...)` in a plain `try/catch` and render the
 * emergency screen from the `catch` - which never runs, because React does not
 * propagate a child's render error up the JS call stack of the parent's render;
 * it unmounts the tree and looks for the nearest error boundary. There was
 * none, so the recovery UI was unreachable and a broken state showed a blank
 * app instead.
 *
 * Deliberately dependency-free: it must survive a broken theme, a broken
 * l10n table and a missing AppProvider, so it reads no context and renders no
 * app component of its own.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryModel,
  ErrorBoundaryStateModel
> {
  constructor(props: ErrorBoundaryModel) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryStateModel {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logging lives here, not in getDerivedStateFromError, which React may call
    // twice in StrictMode/concurrent renders.
    logger.error(
      `Render error caught by ErrorBoundary: ${error?.message ?? error}`
    );
    this.props.onError?.(error, info);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.renderFallback(error, this.reset);
    }
    return this.props.children;
  }
}
