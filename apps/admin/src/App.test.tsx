import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Admin App", () => {
  it("renders operations dashboard heading", () => {
    render(<App />);
    expect(screen.getByText(/Operations Mission Control/i)).toBeInTheDocument();
  });
});
