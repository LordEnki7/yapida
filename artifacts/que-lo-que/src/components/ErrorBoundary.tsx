import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[YaPide ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-6xl mb-4">💥</p>
        <h1 className="text-2xl font-black text-yellow-400 mb-2">Algo salió mal</h1>
        <p className="text-gray-400 text-sm mb-1">
          Ocurrió un error inesperado en la aplicación.
        </p>
        <p className="text-gray-600 text-xs mb-6 font-mono">{this.state.errorId}</p>

        {import.meta.env.DEV && this.state.error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 text-left max-w-sm w-full overflow-auto">
            <p className="text-red-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {this.state.error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-yellow-400 text-black font-black rounded-xl text-sm hover:bg-yellow-300 transition"
          >
            Reintentar
          </button>
          <button
            onClick={this.handleGoHome}
            className="px-5 py-2.5 bg-white/8 border border-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/12 transition"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }
}
