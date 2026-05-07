export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size];
  return (
    <span
      className={`inline-block ${sizeClass} animate-spin rounded-full border-2 border-purple-800 border-t-purple-400`}
      aria-label="Loading"
    />
  );
}
