List of current issues I found in generated BF schema that needs to get prompted out:
-Ensure quotes in inline css are suppressed with backslash
-mb-0 for vertical allignment
-avoid fixed widths for elements with text to ensure none gets cut out

Areas to improve prompt:
-positioning/allignment
    -ensure absolute positioning is used if used in schema
    -ensure mb-0 is used when vertically centerd elements are needed

Lines changed in dev prompt:
 -52
 -168
 -171
 -172
 -174
 
 -623

Lines to be improved in dev prompt:
-171: maybe redundent, I just wanted to be clear that every element in bf json should have some positioning classes since every element in figma will, to avoid issues like in test 1 where positioning was mostly absent.






### Example 5: Navbar with absolute positioning

**Input from figma**


**Expected Output**
```json
{
  "type": "group",
  "styleClasses": "flex flex-row gap-[16px] p-[16px] bg-[#FFFFFF] rounded-[12px] shadow-md w-full h-auto",
  "attributes": {
    "data-idbf": "idbf_g_70_300"
  },
  "fields": [
    {
      "type": "html",
      "html": "<div></div>",
      "styleClasses": "w-[100px] h-[100px] bg-[#3B82F6] rounded-[8px]",
      "attributes": {
        "data-idbf": "idbf_e_70_301"
      },
      "BFName": "card_image"
    },
    {
      "type": "group",
      "styleClasses": "flex flex-col gap-[8px] flex-1",
      "attributes": {
        "data-idbf": "idbf_g_70_302"
      },
      "fields": [
        {
          "type": "html",
          "html": "<h3 class=\"text-[18px] font-bold text-[#111827]\">Title</h3>",
          "attributes": {
            "data-idbf": "idbf_e_70_303"
          },
          "BFName": "card_title"
        },
        {
          "type": "html",
          "html": "<p class=\"text-[14px] text-[#6B7280]\">Description text goes here</p>",
          "attributes": {
            "data-idbf": "idbf_e_70_304"
          },
          "BFName": "card_description"
        }
      ],
      "BFName": "card_content"
    }
  ],
  "BFName": "card"
}
```