import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import DashboardContentWrapper from "@/components/dashboard-content-wrapper";

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
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar for Desktop */}
        <Sidebar userRole={session?.rol || 'admin'} />

        {/* Dynamic Content Wrapper */}
        <DashboardContentWrapper userEmail={session?.email || 'doctor@clinica.com'}>
          {children}
        </DashboardContentWrapper>
      </div>
    </SidebarProvider>
  );
}
