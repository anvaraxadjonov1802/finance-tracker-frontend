export default function SectionHeader({ title, subtitle, action }) {
    return (
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    );
  }