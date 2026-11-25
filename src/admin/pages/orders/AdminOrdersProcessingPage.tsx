import {
  AdminOrdersCardGrid,
  AdminOrdersTabs,
  AdminOrdersToolbar,
  useAdminOrdersPage,
} from "./AdminOrdersShared";

export function AdminOrdersProcessingPage() {
  const {
    orders,
    filtered,
    counts,
    tab,
    setTab,
    branchFilter,
    setBranchFilter,
    search,
    setSearch,
    viewOrderId,
    setViewOrderId,
    viewOpen,
  } = useAdminOrdersPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-coffee-dark">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Customer checkout orders. Open a card for full details — date, customer, payment, and
          items.
        </p>
      </div>

      <AdminOrdersTabs tab={tab} setTab={setTab} counts={counts} />
      <AdminOrdersToolbar
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        search={search}
        setSearch={setSearch}
      />
      <AdminOrdersCardGrid
        orders={orders}
        filtered={filtered}
        viewOrderId={viewOrderId}
        setViewOrderId={setViewOrderId}
        viewOpen={viewOpen}
      />
    </div>
  );
}
