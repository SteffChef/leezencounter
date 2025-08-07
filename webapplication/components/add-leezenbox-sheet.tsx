"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addLeezenbox } from "@/actions/add-leezenbox";

// Zod schema for form validation
const leezenboxSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address must be less than 255 characters"),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .max(10, "Postcode must be less than 10 characters"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  num_lockers_with_power: z
    .number()
    .min(0, "Must be 0 or greater")
    .int("Must be a whole number"),
  capacity: z
    .number()
    .min(1, "Capacity must be at least 1")
    .int("Must be a whole number"),
});

type LeezenboxFormData = z.infer<typeof leezenboxSchema>;

interface AddLeezenboxSheetProps {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback for when leezenbox is successfully added
}

const AddLeezenboxSheet: React.FC<AddLeezenboxSheetProps> = ({
  sheetOpen,
  setSheetOpen,
  onSuccess,
}) => {
  const form = useForm<LeezenboxFormData>({
    resolver: zodResolver(leezenboxSchema),
    defaultValues: {
      name: "",
      address: "",
      postcode: "",
      city: "",
      latitude: 0,
      longitude: 0,
      num_lockers_with_power: 0,
      capacity: 1,
    },
  });

  const handleSubmit = async (data: LeezenboxFormData) => {
    try {
      const newLeezenbox = await addLeezenbox(data);

      if (newLeezenbox) {
        // Close the sheet and reset form on successful submission
        setSheetOpen(false);
        form.reset();

        // Call optional success callback
        if (onSuccess) {
          onSuccess();
        }

        // Reload the page to refresh the Leezenboxes data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // You could add toast notification here to show the error to the user
    }
  };

  const handleClose = () => {
    setSheetOpen(false);
    form.reset();
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[50vw] max-w-[80vw] md:max-w-[40vw] lg:max-w-[30vw] p-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Leezenbox</SheetTitle>
          <SheetDescription>
            Enter the details for the new Leezenbox location. All fields are
            required.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., City Center Leezenbox"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this Leezenbox location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weseler Straße 123" {...field} />
                  </FormControl>
                  <FormDescription>
                    Street address of the Leezenbox
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 48143" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Münster" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 48.1351"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 11.5820"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormDescription className="text-xs">
              Tip: You can find coordinates by right-clicking on Google Maps and
              selecting the coordinates that appear.
            </FormDescription>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="num_lockers_with_power"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lockers with Power</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 5"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Number of lockers with charging capability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 20"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of bike parking spots
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1"
              >
                {form.formState.isSubmitting ? "Adding..." : "Add Leezenbox"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddLeezenboxSheet;
