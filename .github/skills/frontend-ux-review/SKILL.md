---
name: frontend-ux-review
description: "Review front-end UI code for UX best practices. Use when: auditing HTML/CSS/JS for responsiveness, animations, performance, form UX, interaction quality, mobile-first design, micro-interactions, perceived speed, or user experience issues."
argument-hint: "Describe the component or page to review, or paste a file path"
---

# Front-End UX Review

Review existing front-end code and produce actionable UX improvement recommendations focused on responsiveness, animations, performance, and form patterns.

## When to Use

- Reviewing a component, page, or feature for UX quality
- Auditing CSS/HTML/JS for responsive design gaps
- Checking animation smoothness and interaction feedback
- Identifying performance bottlenecks affecting perceived speed
- Validating form UX patterns (error states, feedback, flow)

## Procedure

### 1. Identify Target Files

Locate the HTML, CSS, and JavaScript files for the component or page being reviewed. If a file path is provided as an argument, start there. Otherwise, search for relevant front-end files.

### 2. Responsive Design Audit

Check for these issues:

- **Viewport meta tag** present and correct
- **Media queries** cover mobile (<768px), tablet (768–1024px), desktop (>1024px)
- **Flexible units** (rem, em, %, vw/vh) instead of fixed px for layout dimensions
- **Touch targets** are at least 44×44px on mobile
- **No horizontal overflow** at any breakpoint
- **Images** use `max-width: 100%` or responsive `srcset`
- **Font sizes** remain readable (min 16px body text on mobile)
- **Flex/Grid layouts** adapt gracefully vs. rigid columns

### 3. Animations & Micro-interactions Audit

Check for these issues:

- **Transitions** on interactive elements (hover, focus, active states)
- **Duration** is between 150ms–400ms (avoid sluggish or jarring)
- **Easing** uses appropriate curves (`ease-out` for entrances, `ease-in` for exits)
- **`prefers-reduced-motion`** media query respected for users who opt out
- **No layout thrashing** — animate only `transform` and `opacity` for 60fps
- **Feedback on click/tap** — visual confirmation the action registered
- **Loading states** — skeleton screens or spinners for async content
- **State transitions** — elements don't appear/disappear abruptly

### 4. Performance Audit (Perceived Speed)

Check for these issues:

- **Critical CSS** inlined or loaded first; non-critical deferred
- **JavaScript** loaded with `defer` or at end of `<body>`
- **Images** are optimized (WebP/AVIF), lazy-loaded below the fold
- **No render-blocking resources** in `<head>` without async/defer
- **CSS animations** use GPU-accelerated properties (`transform`, `opacity`)
- **Avoid large DOM** — excessive nesting hurts paint performance
- **Font loading** uses `font-display: swap` to prevent FOIT
- **Bundle size** — flag large inline scripts or unused CSS

### 5. Form UX Audit

Check for these issues (skip if no forms present):

- **Labels** associated with inputs (via `for`/`id` or wrapping)
- **Input types** match content (`email`, `tel`, `number`, `url`)
- **Autocomplete attributes** present for common fields
- **Inline validation** — errors shown next to the field, not only at top
- **Error messages** are specific ("Email must include @") not generic ("Invalid input")
- **Disabled submit** until required fields are valid, or clear error on submit
- **Tab order** is logical (no random `tabindex` values)
- **Success feedback** — clear confirmation after form submission
- **Mobile keyboard** — numeric inputs trigger number pad

### 6. Generate Report

Produce a structured report with:

```
## UX Review: [Component/Page Name]

### Summary
[1-2 sentence overall assessment]

### Critical Issues (must fix)
- [ ] Issue description → suggested fix

### Improvements (should fix)
- [ ] Issue description → suggested fix

### Nice-to-have (consider)
- [ ] Issue description → suggested fix
```

Prioritize issues by user impact: broken functionality > confusing interactions > suboptimal polish.

## Quality Criteria

A good review:
- Cites specific line numbers or selectors
- Provides concrete code snippets for each fix
- Considers real user scenarios (slow network, touch device, keyboard-only)
- Doesn't flag non-issues or make changes outside UX scope
