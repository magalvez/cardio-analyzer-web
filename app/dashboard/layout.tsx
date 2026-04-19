import { getSession } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar for Desktop */}
      <Sidebar userRole={session?.rol || 'admin'} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[var(--spacing-sidebar)] lg:group-has-[[data-collapsed=true]]:pl-[80px] transition-all duration-300">
        <Topbar userEmail={session?.email || 'doctor@clinica.com'} />
        
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
