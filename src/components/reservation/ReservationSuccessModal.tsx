import { FormSuccessModal } from "@/components/ui/FormSuccessModal";

const RESERVATION_SUCCESS_MESSAGE =
  "You have successfully filled in your reservation. We will check up on you soon — thanks for your patience.";

export function ReservationSuccessModal({
  open,
  onClose,
  offlineNote,
}: {
  open: boolean;
  onClose: () => void;
  offlineNote?: string;
}) {
  return (
    <FormSuccessModal
      open={open}
      onClose={onClose}
      title="Congratulations!"
      message={RESERVATION_SUCCESS_MESSAGE}
      titleId="reservation-success-title"
      offlineNote={offlineNote}
    />
  );
}
