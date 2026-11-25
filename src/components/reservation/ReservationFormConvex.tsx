import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { hasConvex } from "@/providers/AppProviders";
import { ReservationForm } from "./ReservationForm";

export function ReservationFormConvex() {
  if (!hasConvex()) {
    return (
      <ReservationForm
        onSubmit={async () => {
          await new Promise((r) => setTimeout(r, 400));
        }}
        offlineNote="Convex is not configured."
      />
    );
  }

  return <ReservationFormConvexInner />;
}

function ReservationFormConvexInner() {
  const createReservation = useMutation(api.reservations.create);

  return (
    <ReservationForm
      onSubmit={async (payload) => {
        await createReservation({
          branchId: payload.branchId,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          date: payload.date,
          time: payload.time,
          guests: payload.guests,
          notes: payload.notes,
        });
      }}
    />
  );
}

