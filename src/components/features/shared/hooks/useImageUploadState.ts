import { useState, useEffect, useRef } from "react";

// Tracks the three possible states for a single image field during an edit:
// 1. untouched -- show the existing saved URL, submit nothing (keep as-is)
// 2. replaced  -- a new File was picked, show its local preview, submit the File
// 3. removed   -- user cleared it, show nothing, submit a "remove" flag
export function useImageUploadState() {
  const [file, setFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [changed, setChanged] = useState(false);
  const newPreviewRef = useRef<string | null>(null);
  useEffect(() => {
    newPreviewRef.current = newPreview;
  }, [newPreview]);

  // Revoke any outstanding object URL when this field unmounts
  useEffect(() => {
    return () => {
      if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
    };
  }, []);

  const selectFile = (f: File | null) => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(f);
    setNewPreview(f ? URL.createObjectURL(f) : null);
    if (f) {
      setRemoved(false)
      setChanged(true)
    };
  };

  const remove = () => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(null);
    setNewPreview(null);
    setRemoved(true);
    setChanged(false)
  };

  // Called when the dialog opens for a (possibly new) org -- resets to
  // whatever URL is already saved for that org, clearing any pending edits.
  const reset = (url: string | null) => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setFile(null);
    setNewPreview(null);
    setExistingUrl(url);
    setRemoved(false);
  };

  const displayPreview = file ? newPreview : removed ? null : existingUrl;

  return { file, displayPreview, removed, changed, selectFile, remove, reset };
}
