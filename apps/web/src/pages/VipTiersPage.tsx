import { lazy, Suspense } from "react";
import { useVipStore } from "../store/vip";
import { NebulaLoader } from "../components/ui/NebulaLoader";

const VipTiersShowcase = lazy(() => import("../components/vip/VipTiersShowcase").then(module => ({ default: module.VipTiersShowcase })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <NebulaLoader />
  </div>
);

export const VipTiersPage = () => {
  const { currentTier } = useVipStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<PageLoader />}>
          <VipTiersShowcase currentTier={currentTier} />
        </Suspense>
      </div>
    </div>
  );
};

