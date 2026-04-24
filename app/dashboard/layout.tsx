import { Sidebar } from "@/components/layout/sidebar"
import { BranchGuard } from "@/components/branch/branch-guard"
import { TrialBanner } from "@/components/trial-banner"
import { TrialExpiredGuard } from "@/components/trial-expired"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-zinc-50 overflow-auto">
        <TrialExpiredGuard>
          <TrialBanner />
          <BranchGuard>
            {children}
          </BranchGuard>
        </TrialExpiredGuard>
      </main>
    </div>
  )
}