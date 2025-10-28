General Info:
-Model: gpt5-mini
-Reasoning: medium

What it did right:
-Structre of groups and elements is clean
-Text for everything is present in schema and each in its own element
-Elements use flex tailwind positioning ie: text-right, flex items-center
-Text renders

What it did wrong:
-Elements are not positioned correctly (in schema it looks ok but renders like there is no css)
-Doesn't escape all quotes


Deep dive notes:
- used justify-center when it should have been justify-between
- color renders when using bg-white/black but not bg-[#ffffff]
- used input_placeholder_small_off when html or text would be ideal
