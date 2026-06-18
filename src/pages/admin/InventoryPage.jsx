import { PackageOpen } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-800">
            Inventory
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your stock and products
          </p>
        </div>
      </div>

      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-heading font-semibold text-slate-800 mb-2">Coming Soon</h2>
        <p className="text-slate-500 max-w-md">
          The Inventory management page is currently under development. You will be able to edit and manage stock here soon!
        </p>
      </div>
    </div>
  );
}
