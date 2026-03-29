#!/usr/bin/env python3
"""Add subtitles to demo.cast by injecting output events."""
import json
import sys

SUBTITLES = [
    # First run
    (3.0, 7.0, "Browse all Claude Code sessions in one place"),
    (7.0, 12.0, "Navigate with j/k"),
    (12.0, 15.5, "Preview full conversations"),
    (15.5, 18.5, "Scroll with j/k, page with u/d"),
    (18.5, 22.0, "Dive into any session with Enter"),
    # Second run
    (25.6, 28.0, "Navigate with j/k"),
    (28.0, 30.3, "Sort by recent or message count"),
    (30.3, 33.2, "Bookmark important sessions"),
    (33.2, 38.5, "View your bookmarks"),
    (38.5, 43.7, "Search through conversations"),
    (43.7, 48.0, "Help shows all keybindings"),
    (52.0, 56.0, "Dive into your sessions"),
]

def make_subtitle_event(text, cols):
    """Create ANSI escape to show subtitle at bottom of screen."""
    # Save cursor, move to bottom-2, clear line, write centered text, restore cursor
    padded = text.center(cols)
    return f"\x1b7\x1b[55;1H\x1b[2K\x1b[1;33m{padded}\x1b[0m\x1b8"

def make_clear_event(cols):
    """Clear subtitle line."""
    return f"\x1b7\x1b[55;1H\x1b[2K\x1b8"

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else "demo.cast"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "demo_sub.cast"

    with open(input_file) as f:
        lines = f.readlines()

    header = json.loads(lines[0])
    cols = header["term"]["cols"]

    # Parse events with absolute timestamps
    events = []
    total = 0
    for line in lines[1:]:
        ev = json.loads(line)
        total += ev[0]
        events.append({"abs_time": total, "type": ev[1], "data": ev[2]})

    # For each output event during a subtitle window, re-inject the subtitle after it
    # This ensures Ink screen redraws don't erase the subtitle
    subtitle_events = []
    for start, end, text in SUBTITLES:
        sub_data = make_subtitle_event(text, cols)
        clear_data = make_clear_event(cols)
        # Add initial subtitle
        subtitle_events.append({"abs_time": start, "type": "o", "data": sub_data})
        # Re-inject after every output event within the window
        for ev in events:
            if ev["type"] == "o" and start < ev["abs_time"] < end:
                subtitle_events.append({"abs_time": ev["abs_time"] + 0.001, "type": "o", "data": sub_data})
        # Clear at end
        subtitle_events.append({"abs_time": end, "type": "o", "data": clear_data})

    events.extend(subtitle_events)

    # Sort by absolute time
    events.sort(key=lambda e: e["abs_time"])

    # Convert back to relative timestamps
    with open(output_file, "w") as f:
        f.write(lines[0])  # header
        prev = 0
        for ev in events:
            delta = ev["abs_time"] - prev
            prev = ev["abs_time"]
            f.write(json.dumps([delta, ev["type"], ev["data"]]) + "\n")

    print(f"Added {len(SUBTITLES)} subtitles to {output_file}")

if __name__ == "__main__":
    main()
