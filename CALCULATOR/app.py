"""
Calculator Backend — Flask
Handles basic arithmetic: +  −  ×  ÷  %  ^
"""

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# ── Helper ────────────────────────────────────────────────────────────────────

def fmt(value: float) -> str:
    """Format a float cleanly: drop .0 for whole numbers, cap precision."""
    if value == int(value) and abs(value) < 1e15:
        return str(int(value))
    return f"{value:.10g}"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True) or {}

    # Parse inputs
    try:
        num1 = float(data["num1"])
        num2 = float(data["num2"])
    except (KeyError, ValueError, TypeError):
        return jsonify({"error": True, "result": "Input Error"})

    operation = data.get("operation", "")

    # Perform calculation
    if operation == "+":
        result = num1 + num2

    elif operation == "-":
        result = num1 - num2

    elif operation == "×":
        result = num1 * num2

    elif operation == "÷":
        if num2 == 0:
            return jsonify({"error": True, "result": "Div by Zero"})
        result = num1 / num2

    elif operation == "%":
        if num2 == 0:
            return jsonify({"error": True, "result": "Div by Zero"})
        result = num1 % num2

    elif operation == "^":
        result = num1 ** num2

    else:
        return jsonify({"error": True, "result": "Unknown Op"})

    return jsonify({"error": False, "result": fmt(result)})


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
