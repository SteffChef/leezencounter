"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";
import { deleteLeezenbox } from "@/actions/delete-leezenbox";
import { toast } from "sonner";

interface DeleteLeezenboxButtonProps {
  leezenboxId: number;
  leezenboxName?: string; // Optional name for better UX in the dialog
  isDefaultLocation?: boolean; // Add flag to disable deletion for default locations
}

const DeleteLeezenboxButton: React.FC<DeleteLeezenboxButtonProps> = ({
  leezenboxId,
  leezenboxName,
  isDefaultLocation = false,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteLeezenbox(leezenboxId);

      if (result.success) {
        // Navigate back to the leezenboxes list page after successful deletion
        router.push("/leezenboxes");
        toast.success(
          `Leezenbox ${
            leezenboxName ? `"${leezenboxName}"` : ""
          } deleted successfully!`
        );
      } else {
        toast.error(
          result.error ||
            `Failed to delete Leezenbox ${
              leezenboxName ? `"${leezenboxName}"` : ""
            }.`
        );
        // Optionally reload the page to ensure fresh data
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting leezenbox:", error);
      toast.error("An unexpected error occurred while deleting the Leezenbox.");
    } finally {
      setIsDeleting(false);
    }
  };

  // If this is a default location, show a disabled button with explanation
  if (isDefaultLocation) {
    return (
      <div className="space-y-2">
        <Button variant="destructive" disabled>
          <Trash className="h-4 w-4" />
          Cannot Delete Default Location
        </Button>
        <p className="text-sm text-muted-foreground">
          This location is marked as default and cannot be deleted.
        </p>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}>
          <Trash className="h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete Leezenbox"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            Leezenbox
            {leezenboxName && ` "${leezenboxName}"`} and remove all associated
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLeezenboxButton;
