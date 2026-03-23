export default function EmptyState({ title, description }) {
    return (
      <div className="text-center border rounded-2xl bg-white p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          📭
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-500 max-w-md mx-auto">{description}</p>
      </div>
    );
  }