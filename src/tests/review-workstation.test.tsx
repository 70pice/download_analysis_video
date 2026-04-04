import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewWorkstation } from "@/components/review-workstation";

describe("review workstation", () => {
  it("renders both analysis and remix sections", () => {
    render(<ReviewWorkstation initialProject={null} />);

    expect(screen.getByLabelText(/source url/i)).toBeInTheDocument();
    expect(screen.getByText(/creative rewrite workspace/i)).toBeInTheDocument();
  });
});
