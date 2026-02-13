"use client";

import { SavesView } from "@/components/dashboard/saves-view";

export default function HighlightsPage() {
  return <SavesView sourceType="highlight" emptyMessage="Select text on any page and press Ctrl+Shift+S to save a highlight" />;
}
