# Decision Agent - Testing Guide

## Overview

This project uses a combination of automated integration tests and manual testing.

## Automated Tests

### Running Tests

```bash
# Run all API tests
npm run test:api

# Expected output:
# ═══════════════════════════════════════════
#   Decision Agent API Integration Tests
# ═══════════════════════════════════════════
#
# → Test 1: Request validation (missing fields)
# ✓ Correctly rejects empty options with 400
#
# → Test 2: Request validation (missing optionB)
# ✓ Correctly rejects missing optionB with 400
#
# → Test 3: Valid request with SSE stream
# ✓ SSE stream started correctly
# ✓ Received X events
# → Event types: thought, search, search_result, question
# ✓ Valid events received
#
# → Test 4: Resume decision with user answer
# ✓ Received X events after resume
#
# → Test 5: Check if decision eventually finalizes
# ✓ (or) No final decision event (may need more rounds)
#
# ═══════════════════════════════════════════
#   Results: 5/5 tests passed
# ═══════════════════════════════════════════
```

### Test Coverage

| Test | Description |
|------|-------------|
| Test 1 | Validates empty input rejection |
| Test 2 | Validates missing optionB rejection |
| Test 3 | Tests SSE stream initialization and event flow |
| Test 4 | Tests resuming conversation with answer |
| Test 5 | Tests final decision event (optional) |

### Adding New Tests

Edit `tests/api.test.ts`:

```typescript
async function testNewFeature() {
  log("Test X: Description");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionA: "Test A",
        optionB: "Test B",
        scenario: "Test scenario"
      })
    });

    // Assertions
    if (response.status !== 200) {
      log(`Expected 200, got ${response.status}`, "error");
      return false;
    }

    log("Test passed!", "success");
    return true;
  } catch (error) {
    log(`Test failed: ${error}`, "error");
    return false;
  }
}
```

Then add to `runTests()`:

```typescript
results.push(await testNewFeature());
console.log("");
```

## Manual Testing

### Test Scenarios

#### 1. Simple Decision

**Input:**
- Option A: Tea
- Option B: Coffee
- Verb: drink

**Expected:**
- Stream starts
- AI asks relevant questions
- Final decision given within 5 rounds

#### 2. Complex Decision with Searches

**Input:**
- Option A: MacBook Pro M3
- Option B: Dell XPS 15
- Verb: buy

**Expected:**
- Multiple searches executed
- Questions about budget, use case, etc.
- Informed decision with reasoning

#### 3. Edge Cases

**Empty inputs:**
- Should show validation error

**Very long options:**
- Should handle gracefully

**Special characters:**
- Should not break the UI

### Browser Testing Checklist

#### Initial Load
- [ ] Page loads without console errors
- [ ] Form is interactive
- [ ] Dark mode works (if implemented)

#### Form Submission
- [ ] Submit button works
- [ ] Loading state shows
- [ ] Validation prevents empty submission

#### Streaming
- [ ] SSE connection established
- [ ] Thought messages appear
- [ ] Search indicators show
- [ ] Search results display
- [ ] Question card appears

#### Question/Answer
- [ ] Options are clickable
- [ ] Custom input works
- [ ] Submit answer works
- [ ] Answer appears in history
- [ ] Question stays in history

#### Final Decision
- [ ] Final result displays
- [ ] Actual option name shown (not "Option A/B")
- [ ] Reason is displayed
- [ ] Restart button works

### Mobile Testing

Test on:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Various screen sizes

Check:
- [ ] Layout is responsive
- [ ] Touch targets are large enough
- [ ] Text is readable
- [ ] No horizontal scroll

## Debugging Failed Tests

### API Test Failures

**Test hangs:**
```bash
# Check if server is running
ps aux | grep "next dev"

# Check port
lsof -i:3000

# Try different port
API_URL=http://localhost:3001/api/decision npm run test:api
```

**Connection refused:**
```bash
# Start server first
npm run dev &
sleep 5
npm run test:api
```

**Wrong response:**
```bash
# Enable verbose logging
# Edit tests/api.test.ts and add:
console.log("Response:", await response.text());
```

### Browser Issues

**Hydration errors:**
- Check for `Math.random()` or `Date.now()` in render
- See [Common Mistakes](COMMON_MISTAKES.md#hydration-mismatch)

**API errors:**
- Check Network tab in DevTools
- Verify `.env.local` has correct keys
- Check server logs

**UI not updating:**
- Check React DevTools for state
- Verify event handlers are connected
- Check for JavaScript errors

## Performance Testing

### Load Testing

```bash
# Simple load test
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/decision \
    -H "Content-Type: application/json" \
    -d '{"optionA":"A","optionB":"B","scenario":"test"}' &
done
wait
```

### Metrics to Check

- Time to first event: < 2s
- Time to question: < 10s (with search)
- Total decision time: < 30s
- Memory usage: Monitor in Activity Monitor/ Task Manager

## Regression Testing

Before each release, verify:

1. [ ] All API tests pass
2. [ ] Simple decision flow works
3. [ ] Complex decision with searches works
4. [ ] Mobile layout is correct
5. [ ] Dark mode works
6. [ ] Error handling works
7. [ ] Restart button works

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test:api
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
```
