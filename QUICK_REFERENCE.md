# Smart AI Quick Add Parser - Quick Reference Guide

## What Works Now

### Natural Language Input Examples

#### Module + Task + Date + Time + Priority
```
finish CS2030S assignment 1 friday 9pm high
→ Module: CS2030S | Title: finish assignment 1 | Due: Friday 9 PM | Priority: High
```

#### Module + Task + Relative Date
```
ST2334 quiz 2 tomorrow
→ Module: ST2334 | Title: quiz 2 | Due: Tomorrow 8 PM | Priority: Medium
```

#### Task + ISO Date + Urgent
```
orbital README 2026-05-20 20:00 urgent
→ Module: none | Title: orbital README | Due: May 20, 2026 8 PM | Priority: High
```

#### Module + Task + Slash Date
```
CS2040 tutorial 3 20/05
→ Module: CS2040 | Title: tutorial 3 | Due: May 20 8 PM | Priority: Medium
```

## How to Use

### Quick Add Syntax

The parser understands natural language patterns. You can combine these elements in any order:

#### 1. Module Reference (Pick One)
```
CS2030S          (exact code, case-insensitive)
st2334           (any case works)
CS2040
BT1101
IS2218
```

#### 2. Task Description
```
"finish assignment 1"
"study for quiz 2"
"complete README"
"tutorial 3"
```

#### 3. Date (Pick One)

**Relative**:
```
today
tomorrow
this friday
next monday
friday
monday
```

**Specific**:
```
20 May          → Current year, May 20
May 20          → Current year, May 20
20/05           → Current year, May 20
20/05/2026      → May 20, 2026
2026-05-20      → May 20, 2026 (ISO format)
```

#### 4. Time (Optional, defaults to 8 PM)
```
8pm
20:00
9:30am
at 8 PM
@ 9pm
by 10 PM
```

#### 5. Priority (Optional, defaults to Medium)
```
high            → High
urgent          → High
asap            → High
critical        → High
low             → Low
later           → Low
```

### Examples by Use Case

#### For Assignment Submissions
```
CS2030S assignment 3 friday 8pm high
→ Module: CS2030S, Title: "assignment 3", Deadline: Friday 8 PM, Priority: High
```

#### For Exams/Quizzes
```
ST2334 midterm next monday urgent
→ Module: ST2334, Title: "midterm", Deadline: Next Monday 8 PM, Priority: High
```

#### For Projects
```
BT1101 project 2 2026-05-20 20:00
→ Module: BT1101, Title: "project 2", Deadline: May 20, 2026 8 PM, Priority: Medium
```

#### For Reading
```
IS2218 chapter 5 reading tomorrow low
→ Module: IS2218, Title: "chapter 5 reading", Deadline: Tomorrow 8 PM, Priority: Low
```

## What Gets Detected

### ✅ Always Detected
- **Module codes**: CS2030S, ST2334, etc. (case-insensitive)
- **Task title**: Preserved with numbers and meaningful words
- **Relative dates**: today, tomorrow, friday, next monday, etc.
- **Specific dates**: 20 May, 2026-05-20, 20/05
- **Time**: 8pm, 20:00, 9:30am, at 8pm
- **Priority**: high, urgent, asap, low, later

### ✅ Smart Features
- **Number preservation**: "assignment 1" stays as "assignment 1"
- **Case insensitivity**: "cs2030s" works just like "CS2030S"
- **Word boundary matching**: Won't accidentally match "CS20" in "CS2030S"
- **Date validation**: Invalid dates are rejected gracefully
- **Time zone free**: All times local to your browser

### ⚠️ Limitations
- **One module per input**: Can't parse multiple modules
- **English only**: Recognizes English month/day names
- **No AI learning**: Parser rules are fixed (no learning from patterns)
- **Relative to today**: No support for "2 weeks from now"
- **No recurring**: No pattern like "every friday"

## Preview Chips Explanation

When you type, you'll see 4 preview chips:

### 🎯 Priority
Shows detected priority level:
- **Red**: High priority (urgent, asap, critical)
- **Amber**: Medium priority (default)
- **Blue**: Low priority (low, later)

### 📅 Due
Shows parsed deadline:
- Format: "Day, Date Time" (e.g., "Fri, 15 May 09:00 pm")
- "No deadline" if nothing detected

### 📚 Module
Shows detected module:
- Module code if detected (e.g., "CS2030S")
- "(not detected)" if no module found

### ✨ Title
Shows cleaned title:
- All metadata removed (dates, times, priority, module)
- Only meaningful task words kept
- "(title will be extracted)" if empty

## Common Mistakes & Fixes

### ❌ "9p" or "9PM" not parsing
**Problem**: Sometimes partial times like "9p" are left in
**Solution**: Use full format like "9pm" or "at 9pm"

### ❌ Numbers disappearing from title
**Old behavior**: "assignment 1" would become "assignment"
**New behavior**: Numbers are preserved! "assignment 1" stays intact

### ❌ Module not detected
**Reasons**:
1. Module code not entered exactly (check case and spelling)
2. Module not in your modules list
3. Multiple modules in one input (not supported)

**Solution**: Enter exact module code, one task at a time

### ❌ Date not parsing
**Common issues**:
1. Weekday typed but no specific context ("friday" alone might not work)
2. Invalid date for month (Feb 30 won't work)
3. Typo in month name

**Solution**: 
- Use "tomorrow" or "today" if unclear
- Or use explicit format like "20 May" or "2026-05-20"

## Testing What You Type

The live preview chips show exactly what the parser will detect. If something looks wrong in the preview, it will be wrong when submitted.

### Good Preview Example
```
Input: "finish CS2030S assignment 1 friday 9pm high"
Preview shows:
🎯 Priority: High           ✓ Correct
📅 Due: Fri, 15 May 09:00 pm   ✓ Correct
📚 Module: CS2030S          ✓ Correct
✨ Title: finish assignment 1   ✓ Correct
```

### Needs Adjustment Example
```
Input: "do homework"
Preview shows:
🎯 Priority: Medium         ✓ OK (default)
📅 Due: No deadline         ✗ Add a date
📚 Module: (not detected)   ✗ Add module code
✨ Title: do homework       ✓ OK
→ Fix by adding "CS2030S tomorrow"
```

## Tips for Best Results

1. **Start with module code**
   ```
   ✓ Good: "CS2030S assignment friday"
   ? Less clear: "assignment friday CS2030S"
   ```

2. **Use full time format**
   ```
   ✓ Good: "8pm" or "20:00"
   ? Unclear: "8p" or "20h"
   ```

3. **Be natural, not robotic**
   ```
   ✓ Good: "finish CS2030S assignment friday 8pm high"
   ✓ Also good: "CS2030S assignment high priority by friday 8pm"
   ? Awkward: "CS2030S | assignment | friday | 8pm | high"
   ```

4. **Use descriptive task titles**
   ```
   ✓ Good: "CS2030S assignment 1"
   ? Vague: "CS2030S work"
   ✓ Good: "ST2334 quiz 2"
   ? Vague: "ST2334 test"
   ```

5. **Trust the preview**
   If the preview looks wrong, fix the input before submitting.

## Keyboard Shortcuts

- **Enter**: Submit the quick add
- **Escape**: Clear input (in some forms)
- **Tab**: Move between form fields

## Integration with Other Features

### Bulk Import
The same parser rules apply to bulk import! Each line is parsed as a separate task using the smart parser.

**Bulk import example**:
```
CS2030S assignment 1 friday 9pm
ST2334 quiz 2 tomorrow
BT1101 lab report 20/05
```

### Task Status
After creating a task with Quick Add, you can:
- ✓ Mark as Complete
- ◐ Mark as In Progress
- ○ Leave as Pending

### Kanban Board
Quick-added tasks appear in the appropriate column based on their status. Change status with the action buttons.

## Need Help?

- **Preview seems wrong?** Check each part (module, date, time, priority)
- **Task not created?** Common reason: module not specified or date invalid
- **Want to bulk import?** Use the "Bulk Import" button with the same syntax
- **Looking for specific task?** Use the Kanban columns or module colors
