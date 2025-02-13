from src.tools import tool_calculator_sum


def test_tool_calculator_sum() -> None:
    """Test the tool_calculator_sum tool."""
    numbers = [1, 2, 3, 4, 5]
    expected = sum(numbers)
    assert tool_calculator_sum.invoke({'numbers': numbers}) == expected
