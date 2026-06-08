"""
  SECURE PASSWORD GENERATOR
  Generates strong random passwords
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import random
import string
import re


# ─── ANSI Color Codes ───────────────────────────────────────────────────────
class Color:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"


# ─── Banner ─────────────────────────────────────────────────────────────────
def print_banner():
    banner = f"""
{Color.CYAN}{Color.BOLD}
  +---------------------------------------------------------+
  |   ____  _____        __  ___  ___  ___  ___  ___       |
  |  |  _ \|  _  |      / / / _ \| _ \|   \|  _||   \      |
  |  | |_) | |_| |  _  / / | | | |    | |) | |_ | |) |     |
  |  |  __/|_____|  |_/_/  |_| |_|_|\_\___/|___||___/      |
  |  |_|                                                    |
  |            [*] SECURE PASSWORD GENERATOR [*]            |
  |         Craft strong, random passwords instantly        |
  +---------------------------------------------------------+
{Color.RESET}"""
    print(banner)


# ─── Password Strength Evaluator ────────────────────────────────────────────
def evaluate_strength(password: str) -> tuple[str, str]:
    """Return a (label, color) tuple based on password strength."""
    score = 0
    if len(password) >= 8:  score += 1
    if len(password) >= 16: score += 1
    if re.search(r"[a-z]", password): score += 1
    if re.search(r"[A-Z]", password): score += 1
    if re.search(r"\d",    password): score += 1
    if re.search(r"[^a-zA-Z0-9]", password): score += 1

    if score <= 2:
        return "WEAK     [!] ", Color.RED
    elif score <= 4:
        return "MODERATE [~] ", Color.YELLOW
    else:
        return "STRONG   [*] ", Color.GREEN


# ─── Password Generator ──────────────────────────────────────────────────────
def generate_password(length: int, use_upper: bool, use_digits: bool, use_symbols: bool) -> str:
    """Generate a random password based on user preferences."""
    character_pool = string.ascii_lowercase  # always include lowercase

    guaranteed = []

    if use_upper:
        character_pool += string.ascii_uppercase
        guaranteed.append(random.choice(string.ascii_uppercase))

    if use_digits:
        character_pool += string.digits
        guaranteed.append(random.choice(string.digits))

    if use_symbols:
        symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        character_pool += symbols
        guaranteed.append(random.choice(symbols))

    # Fill remaining length with random choices from the full pool
    remaining_length = length - len(guaranteed)
    random_part = [random.choice(character_pool) for _ in range(remaining_length)]

    password_list = guaranteed + random_part
    random.shuffle(password_list)

    return "".join(password_list)


# ─── Input Helpers ────────────────────────────────────────────────────────────
def get_password_length() -> int:
    """Prompt user for password length with validation."""
    print(f"\n{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"{Color.BOLD}  [1] STEP 1: Password Length{Color.RESET}")
    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"  {Color.WHITE}Recommended: 12-20 characters for strong passwords.{Color.RESET}")

    while True:
        try:
            length_input = input(f"\n  {Color.YELLOW}Enter desired password length (4-128): {Color.RESET}").strip()
            length = int(length_input)
            if 4 <= length <= 128:
                return length
            else:
                print(f"  {Color.RED}✗ Please enter a value between 4 and 128.{Color.RESET}")
        except ValueError:
            print(f"  {Color.RED}✗ Invalid input. Please enter a whole number.{Color.RESET}")


def get_yes_no(prompt: str) -> bool:
    """Ask a yes/no question and return a boolean."""
    while True:
        answer = input(prompt).strip().lower()
        if answer in ("y", "yes", ""):
            return True
        elif answer in ("n", "no"):
            return False
        else:
            print(f"  {Color.RED}✗ Please enter 'y' (yes) or 'n' (no).{Color.RESET}")


def get_complexity() -> tuple[bool, bool, bool]:
    """Prompt user for password complexity options."""
    print(f"\n{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"{Color.BOLD}  [2] STEP 2: Complexity Options{Color.RESET}")
    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"  {Color.WHITE}(Press Enter to accept default: Yes){Color.RESET}\n")

    use_upper   = get_yes_no(f"  {Color.YELLOW}Include UPPERCASE letters? [Y/n]: {Color.RESET}")
    use_digits  = get_yes_no(f"  {Color.YELLOW}Include NUMBERS (0-9)?      [Y/n]: {Color.RESET}")
    use_symbols = get_yes_no(f"  {Color.YELLOW}Include SYMBOLS (!@#$...)?  [Y/n]: {Color.RESET}")

    return use_upper, use_digits, use_symbols


def get_num_passwords() -> int:
    """Ask how many passwords to generate."""
    print(f"\n{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"{Color.BOLD}  [3] STEP 3: How Many Passwords?{Color.RESET}")
    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}")

    while True:
        try:
            num_input = input(f"\n  {Color.YELLOW}Generate how many passwords? (1-10) [default: 1]: {Color.RESET}").strip()
            if num_input == "":
                return 1
            num = int(num_input)
            if 1 <= num <= 10:
                return num
            else:
                print(f"  {Color.RED}✗ Please enter a value between 1 and 10.{Color.RESET}")
        except ValueError:
            print(f"  {Color.RED}✗ Invalid input. Please enter a whole number.{Color.RESET}")


# ─── Display Results ─────────────────────────────────────────────────────────
def display_passwords(passwords: list[str]):
    """Display the generated passwords with strength indicators."""
    print(f"\n{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"{Color.BOLD}  [OK] GENERATED PASSWORD(S){Color.RESET}")
    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}\n")

    for i, pwd in enumerate(passwords, start=1):
        strength_label, strength_color = evaluate_strength(pwd)
        print(f"  {Color.WHITE}#{i}{Color.RESET}  {Color.GREEN}{Color.BOLD}{pwd}{Color.RESET}")
        print(f"      {Color.WHITE}Strength: {strength_color}{Color.BOLD}{strength_label}{Color.RESET}")
        print(f"      {Color.WHITE}Length:   {len(pwd)} characters{Color.RESET}\n")

    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}")
    print(f"  {Color.MAGENTA}[!] Tip: Use a password manager to store your passwords safely!{Color.RESET}")
    print(f"{Color.CYAN}{'-' * 60}{Color.RESET}\n")


# ─── Save Passwords Option ────────────────────────────────────────────────────
def offer_save(passwords: list[str]):
    """Offer to save passwords to a text file."""
    save = get_yes_no(f"\n  {Color.YELLOW}Save password(s) to a file? [Y/n]: {Color.RESET}")
    if save:
        filename = "generated_passwords.txt"
        with open(filename, "a") as f:
            f.write("-" * 40 + "\n")
            for pwd in passwords:
                f.write(pwd + "\n")
        print(f"\n  {Color.GREEN}[SAVED] Password(s) saved to '{filename}'{Color.RESET}\n")
    else:
        print(f"\n  {Color.WHITE}Passwords not saved.{Color.RESET}\n")


# ─── Main Program Loop ────────────────────────────────────────────────────────
def main():
    print_banner()

    while True:
        # Gather inputs
        length                        = get_password_length()
        use_upper, use_digits, use_symbols = get_complexity()
        num_passwords                 = get_num_passwords()

        # Validate that pool isn't too small for guaranteed characters
        guaranteed_count = sum([use_upper, use_digits, use_symbols])
        if guaranteed_count >= length:
            print(f"\n  {Color.YELLOW}[!] Password length too short for all selected options.")
            print(f"  Increasing length to {guaranteed_count + 1}.{Color.RESET}")
            length = guaranteed_count + 1

        # Generate passwords
        passwords = [
            generate_password(length, use_upper, use_digits, use_symbols)
            for _ in range(num_passwords)
        ]

        # Display results
        display_passwords(passwords)

        # Save option
        offer_save(passwords)

        # Repeat?
        again = get_yes_no(f"  {Color.YELLOW}Generate another password? [Y/n]: {Color.RESET}")
        if not again:
            print(f"\n{Color.CYAN}  Thank you for using the Secure Password Generator! Stay safe!{Color.RESET}\n")
            break

        print(f"\n{Color.CYAN}{'=' * 60}{Color.RESET}\n")


if __name__ == "__main__":
    main()
