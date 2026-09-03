// frontend/src/components/AddReminderModal.tsx
import { useState } from "react";
import { Bell, Calendar, X, Plus } from "lucide-react";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reminder: { title: string; dueDate: string; type: string }) => Promise<void>;
  tripDeparture: string;
}

export function AddReminderModal({
  isOpen,
  onClose,
  onAdd,
  tripDeparture,
}: AddReminderModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(
    tripDeparture ? tripDeparture.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState("travel-preparation");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onAdd({
        title: title.trim(),
        dueDate,
        type,
      });
      setTitle("");
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to create reminder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Create Travel Reminder</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
              Reminder Title / Task
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pick up prescription Malarone from pharmacy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="travel-preparation">Preparation</option>
                <option value="vaccine">Vaccine Clinic</option>
                <option value="malaria">Antimalarial Dose</option>
                <option value="bite-prevention">Bite Prevention</option>
                <option value="checklist">Documents / Packing</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : "Add Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}