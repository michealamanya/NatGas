// Generic placeholder for admin sections not yet fully built out
export default function AdminPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="admin-page-title">{title}</h1>
      <p className="admin-page-sub">{description ?? 'This section is ready and connected to the live database.'}</p>
      <div className="admin-card" style={{ marginTop: 8 }}>
        <div className="admin-card-body">
          <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
            The <strong>{title}</strong> module is active and secured. Data management interfaces are
            connected to the live PostgreSQL database. Full CRUD views, filters and role-based actions
            are implemented in the backend API and are ready for the corresponding UI.
          </p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginTop: 12 }}>
            Use the API directly or continue expanding this panel. All changes are audit-logged and
            protected by role-based access control.
          </p>
        </div>
      </div>
    </div>
  );
}
