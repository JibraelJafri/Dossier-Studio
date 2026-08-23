import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Toolbar } from "../src/components/Toolbar.tsx";
import { DEFAULT_SPACING } from "../src/constants.ts";
import { VisibilitySettings, SpacingSettings } from "../src/types.ts";

const mockVisibility: VisibilitySettings = {
  headerKicker: true,
  targetCard: true,
  availabilityBadge: true,
  recipientBlock: true,
  metrics: true,
  taxonomy: true,
  signoffMeta: true,
  footerStamp: true,
};

const defaultProps = {
  currentPreset: "editorial" as const,
  onSelectPreset: vi.fn(),
  typographyStyle: "editorial" as const,
  onChangeTypography: vi.fn(),
  themePalette: "" as const,
  onChangeThemePalette: vi.fn(),
  visibility: mockVisibility,
  onToggleVisibility: vi.fn(),
  onRestoreAllSections: vi.fn(),
  spacing: DEFAULT_SPACING as SpacingSettings,
  onChangeSpacing: vi.fn(),
  isDark: false,
  onToggleDark: vi.fn(),
  onOpenAiModal: vi.fn(),
  onCopyPlainText: vi.fn(),
  copyFeedback: null,
  onOpenExportModal: vi.fn(),
  onPrint: vi.fn(),
  isExportingPdf: false,
  showA4Guide: false,
  onToggleA4Guide: vi.fn(),
  saveStatus: "Autosaved",
  isPreviewMode: false,
  onTogglePreview: vi.fn(),
  previewScale: "fit" as const,
  onTogglePreviewScale: vi.fn(),
};

describe("Toolbar dropdowns", () => {
  it("opens and closes the Sections Visibility dropdown", () => {
    render(<Toolbar {...defaultProps} />);

    // Dropdown should initially not be in the document
    expect(screen.queryByRole("dialog", { name: "Document Sections Visibility" })).toBeNull();

    // Click on Sections dropdown button
    const sectionsBtn = screen.getByTitle("Configure visible sections");
    fireEvent.click(sectionsBtn);

    // Dropdown dialog should now be open
    const dialog = screen.getByRole("dialog", { name: "Document Sections Visibility" });
    expect(dialog).toBeDefined();
    expect(screen.getByText("Header Kicker")).toBeDefined();

    // Click button again to toggle closed
    fireEvent.click(sectionsBtn);
    expect(screen.queryByRole("dialog", { name: "Document Sections Visibility" })).toBeNull();
  });

  it("opens and closes the Theme Color Palette dropdown", () => {
    const onChangeThemePalette = vi.fn();
    render(<Toolbar {...defaultProps} onChangeThemePalette={onChangeThemePalette} />);

    expect(screen.queryByRole("dialog", { name: "Theme Color Palette" })).toBeNull();

    const paletteBtn = screen.getByTitle("Theme color palette");
    fireEvent.click(paletteBtn);

    const dialog = screen.getByRole("dialog", { name: "Theme Color Palette" });
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText("Terracotta")).toBeDefined();
    expect(within(dialog).getByText("Cobalt")).toBeDefined();

    // Selecting a palette option calls onChangeThemePalette and closes dropdown
    fireEvent.click(within(dialog).getByText("Cobalt"));
    expect(onChangeThemePalette).toHaveBeenCalledWith("theme-cobalt");
    expect(screen.queryByRole("dialog", { name: "Theme Color Palette" })).toBeNull();
  });

  it("opens and closes the Spacing popover", () => {
    render(<Toolbar {...defaultProps} />);

    expect(screen.queryByRole("dialog", { name: "Canvas Spacing Control" })).toBeNull();

    const spacingBtn = screen.getByTitle("Layout & Spacing controls");
    fireEvent.click(spacingBtn);

    const dialog = screen.getByRole("dialog", { name: "Canvas Spacing Control" });
    expect(dialog).toBeDefined();
    expect(screen.getByText("Master Section Rhythm")).toBeDefined();
    expect(screen.getByText("Quick Layout Rhythm")).toBeDefined();

    // Press Escape to close
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Canvas Spacing Control" })).toBeNull();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <Toolbar {...defaultProps} />
      </div>
    );

    const sectionsBtn = screen.getByTitle("Configure visible sections");
    fireEvent.click(sectionsBtn);
    expect(screen.getByRole("dialog", { name: "Document Sections Visibility" })).toBeDefined();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside-element"));
    expect(screen.queryByRole("dialog", { name: "Document Sections Visibility" })).toBeNull();
  });
});
