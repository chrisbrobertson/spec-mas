import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemSearch } from "./ItemSearch";

const mockPersons = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Alice Smith", email: "alice@example.com" },
];

describe("ItemSearch", () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnSearch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search input and filters", () => {
    render(<ItemSearch onSearch={mockOnSearch} persons={mockPersons} />);

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /priority/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /person/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /source/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /include archived/i }),
    ).toBeInTheDocument();
  });

  it("calls onSearch with debounced query", async () => {
    const user = userEvent.setup();
    render(<ItemSearch onSearch={mockOnSearch} persons={mockPersons} />);

    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "test query");

    jest.advanceTimersByTime(300);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test query",
        includeArchived: false,
      }),
    );
  });

  it("applies all filters correctly", async () => {
    const user = userEvent.setup();
    render(<ItemSearch onSearch={mockOnSearch} persons={mockPersons} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /priority/i }),
      "high",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /person/i }),
      "1",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /status/i }),
      "pending",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /source/i }),
      "email",
    );
    await user.click(
      screen.getByRole("checkbox", { name: /include archived/i }),
    );

    const searchButton = screen.getByRole("button", {
      name: /apply search filters/i,
    });
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith({
      query: "",
      priority: "high",
      person: "1",
      status: "pending",
      source: "email",
      includeArchived: true,
    });
  });

  it("clears all filters when reset button clicked", async () => {
    const user = userEvent.setup();
    render(<ItemSearch onSearch={mockOnSearch} persons={mockPersons} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /priority/i }),
      "high",
    );
    await user.click(
      screen.getByRole("button", { name: /clear all filters/i }),
    );

    expect(mockOnSearch).toHaveBeenCalledWith({
      query: "",
      includeArchived: false,
    });
  });

  it("sorts persons alphabetically in dropdown", () => {
    render(<ItemSearch onSearch={mockOnSearch} persons={mockPersons} />);

    const options = screen
      .getAllByRole("option")
      .filter((option) => option.getAttribute("value") !== "");

    expect(options[0].textContent).toBe("Alice Smith");
    expect(options[1].textContent).toBe("John Doe");
  });
});
