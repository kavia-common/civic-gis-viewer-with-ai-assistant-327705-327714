import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Smart GIS Viewer header", () => {
  render(<App />);
  const title = screen.getByText(/Smart GIS Viewer/i);
  expect(title).toBeInTheDocument();
});
