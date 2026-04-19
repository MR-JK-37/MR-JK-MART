import AppCard from './AppCard';

export default function AppGrid({ apps = [], title = '' }) {
  if (!apps.length) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-lg opacity-60 font-body">No apps yet</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {title && (
        <h2 className="font-display text-2xl font-bold mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {apps.map((app, i) => (
          <AppCard key={app.id} app={app} index={i} />
        ))}
      </div>
    </div>
  );
}
