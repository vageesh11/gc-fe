interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="border border-red-700/50 bg-red-950/30 px-5 py-4 flex items-start gap-3">
      <span className="text-red-400 text-lg mt-0.5 font-mono-game">!</span>
      <div className="flex-1">
        <p className="text-red-400 text-sm font-semibold tracking-wide">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-500 hover:text-red-300 tracking-wider uppercase underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
