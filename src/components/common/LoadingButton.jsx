export default function LoadingButton({
    children,
    loading = false,
    className = "",
    ...props
  }) {
    return (
      <button
        {...props}
        disabled={loading || props.disabled}
        className={`disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? "Yuklanmoqda..." : children}
      </button>
    );
  }