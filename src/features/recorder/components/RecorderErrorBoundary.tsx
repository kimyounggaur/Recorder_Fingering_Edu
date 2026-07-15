"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface RecorderErrorBoundaryProps {
  children: ReactNode;
}

interface RecorderErrorBoundaryState {
  hasError: boolean;
}

export class RecorderErrorBoundary extends Component<
  RecorderErrorBoundaryProps,
  RecorderErrorBoundaryState
> {
  state: RecorderErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RecorderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("Recorder learning app error", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-fallback">
          <h1>화면을 불러오지 못했어요.</h1>
          <p>새로고침한 뒤 한 번 더 시도해 주세요.</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            다시 불러오기
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
