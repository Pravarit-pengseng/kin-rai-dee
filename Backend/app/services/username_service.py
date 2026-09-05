import re
import random
import string
from typing import Callable, Optional


def sanitize_username_from_email(email: str) -> str:
    """
    Extracts and sanitizes a username from the given email address.
    Rule:
    1. Take the part before '@' or before the first '.'
    2. Keep only English alphabets [a-zA-Z]
    3. Convert to lowercase [a-z]
    """
    if not email or "@" not in email:
        return ""

    local_part = email.split("@")[0].strip()
    # Before the first dot if dot exists
    prefix = local_part.split(".")[0]

    # Keep only English alphabets
    filtered_chars = re.sub(r"[^a-zA-Z]", "", prefix).lower()
    return filtered_chars


def generate_fallback_english_name(length: int = 6) -> str:
    """
    Generates a fallback random English lowercase username
    if the email prefix contains no English letters.
    """
    prefixes = ["user", "chef", "foodie", "eater", "hungry", "cook"]
    chosen_prefix = random.choice(prefixes)
    random_suffix = "".join(random.choices(string.ascii_lowercase, k=length - len(chosen_prefix) if length > len(chosen_prefix) else 4))
    return f"{chosen_prefix}{random_suffix}"


def generate_unique_username(
    email: str,
    is_username_taken: Optional[Callable[[str], bool]] = None,
    max_attempts: int = 20,
) -> str:
    """
    Generates a unique English lowercase username from email.
    If username exists or cannot be formed, appends English letters or creates a new one.
    """
    base_username = sanitize_username_from_email(email)

    if not base_username:
        base_username = generate_fallback_english_name()

    current_candidate = base_username

    if is_username_taken is None:
        return current_candidate

    attempt = 0
    while is_username_taken(current_candidate) and attempt < max_attempts:
        attempt += 1
        # Append English letters (e.g. 'a', 'b', or 2 random lowercase characters)
        extra_letters = "".join(random.choices(string.ascii_lowercase, k=attempt if attempt <= 3 else 3))
        current_candidate = f"{base_username}{extra_letters}"

    if is_username_taken(current_candidate):
        # Fallback to fresh random English name
        for _ in range(max_attempts):
            candidate = generate_fallback_english_name(8)
            if not is_username_taken(candidate):
                return candidate

    return current_candidate
