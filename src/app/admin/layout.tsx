export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      {children}
    </div>
  );
}
