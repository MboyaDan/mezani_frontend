import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { BranchGuard } from "@/components/branch/branch-guard"
import { TrialBanner } from "@/components/trial-banner"
import { TrialExpiredGuard } from "@/components/trial-expired"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-50 overflow-auto">
          <TrialExpiredGuard>
            <TrialBanner />
            <BranchGuard>
              {children}
            </BranchGuard>
          </TrialExpiredGuard>
        </main>
      </div>
    </SidebarProvider>
  )
}