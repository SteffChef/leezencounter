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

interface DeleteLeezenboxButtonProps {
  leezenboxId: number;
  leezenboxName?: string; // Optional name for better UX in the dialog
}

const DeleteLeezenboxButton: React.FC<DeleteLeezenboxButtonProps> = ({
  leezenboxId,
  leezenboxName,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const success = await deleteLeezenbox(leezenboxId);

      if (success) {
        // Navigate back to the leezenboxes list page after successful deletion
        router.push("/leezenboxes");
        // Optionally reload the page to ensure fresh data
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting leezenbox:", error);
      // You could add toast notification here to show the error
    } finally {
      setIsDeleting(false);
    }
  };

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
