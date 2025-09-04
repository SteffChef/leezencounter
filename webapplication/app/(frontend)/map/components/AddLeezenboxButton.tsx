"use client";

import AddLeezenboxSheet from "@/components/add-leezenbox-sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const AddLeezenboxButton = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setSheetOpen(true)}>
        Add Leezenbox
      </Button>
      <AddLeezenboxSheet sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} />
    </>
  );
};

export default AddLeezenboxButton;
