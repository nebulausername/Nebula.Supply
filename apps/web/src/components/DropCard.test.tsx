import { render, screen } from "@testing-library/react";
import { DropCard } from "./DropCard";
import { drops } from "../data/drops";

describe("DropCard", () => {
  it("renders drop information", () => {
    render(<DropCard drop={drops[0]} onOpen={() => {}} />);
    expect(screen.getByText(/PROBE MINT/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /Interesse zeigen/i });
    expect(buttons[0]).toBeEnabled();
  });
});
