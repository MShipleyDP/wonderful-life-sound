# UI/UX Expert Agent - User Guide

A specialized Claude agent with deep expertise in user interface and user experience design, based on research from the Interaction Design Foundation.

## Quick Start

### Method 1: Slash Command (Easiest)

Simply type in Claude Code:

```
/ui-review
```

This will invoke the UI Expert Agent to analyze your codebase for UI/UX issues.

### Method 2: Direct Invocation

Ask Claude to invoke the UI expert agent:

```
Please invoke the UI/UX expert agent to review my application's design
```

### Method 3: Specific Analysis

Request specific UI/UX analysis:

```
Can you analyze the accessibility of my forms?
Can you review my navigation design?
Check if my color contrast meets WCAG standards
Review my mobile responsiveness
```

## What the Agent Does

The UI Expert Agent will:

1. **Explore Your Codebase**
   - Find all UI files (HTML, CSS, JSX, Vue, Svelte, etc.)
   - Identify components and patterns
   - Map out your UI architecture

2. **Analyze Against Best Practices**
   - Visual hierarchy and layout
   - Accessibility (WCAG AA compliance)
   - Consistency across components
   - Mobile responsiveness
   - Typography and readability
   - Color contrast and usage
   - Navigation patterns
   - Form design
   - Interactive elements (buttons, modals, cards)

3. **Identify Issues**
   - Accessibility violations
   - Poor contrast ratios
   - Inconsistent spacing/styling
   - Small touch targets (<44px)
   - Typography problems
   - Usability issues
   - Mobile responsiveness gaps

4. **Provide Recommendations**
   - **High Priority**: Critical issues (accessibility, usability blockers)
   - **Medium Priority**: Important improvements (consistency, clarity)
   - **Low Priority**: Enhancements (microinteractions, polish)

5. **Deliver Solutions**
   - Specific code changes
   - Before/after examples
   - Design pattern references
   - Tools and resources

## Agent Expertise

### Core Design Principles

**User-Centered Design**
- 50ms rule: Users assess visual appeal in 50 milliseconds
- Design for user mental models, not system architecture
- Validate through user research

**Simplicity**
- Remove unnecessary elements
- Hick's Law: Limit choices to reduce decision time
- Progressive disclosure for complex interfaces

**Consistency**
- Uniform design language
- Follow platform conventions
- Maintain design systems

**Responsiveness**
- Mobile-first approach
- 44x44px minimum touch targets
- Flexible grids and layouts

**Feedback**
- Immediate visual feedback for actions
- 200-500ms animation duration
- Clear loading, success, error states

### Key Metrics

**Typography**
- Minimum: 16px body text
- Line height: 1.5-1.6
- Line length: 45-75 characters
- Font families: 2-3 maximum

**Color & Contrast**
- WCAG AA: 4.5:1 for normal text, 3:1 for large text
- 60-30-10 rule: 60% primary, 30% secondary, 10% accent
- Palette: 5-7 colors maximum

**Spacing**
- Consistent scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- Use whitespace generously
- Group related elements

**Navigation**
- Miller's Law: 7±2 items for optimal recall
- Clear active state
- Breadcrumbs for deep hierarchies

### Pattern Best Practices

The agent knows best practices for:
- Forms (labels, validation, error messages)
- Buttons (sizing, states, labels)
- Cards (padding, elevation, hierarchy)
- Modals (focus trapping, backdrop, close)
- Tables (responsiveness, sorting, pagination)
- Navigation (sticky, active states, mega menus)

## Example Usage

### Example 1: Full UI Review

```
/ui-review
```

**Agent Response:**
```
I'll conduct a comprehensive UI/UX review of your application.

[Agent explores codebase]

**OVERALL ASSESSMENT: 7.5/10**

✅ STRENGTHS:
1. Consistent color palette with good brand identity
2. Mobile-responsive grid layout
3. Clean, modern aesthetic

⚠️ CRITICAL ISSUES:
1. Color contrast failures in navigation (2.1:1, needs 4.5:1)
2. Touch targets too small on mobile (32px, needs 44px)
3. Form labels disappear on input (placeholder-only pattern)

⚠️ IMPORTANT ISSUES:
1. Inconsistent spacing (mixing px, rem, em)
2. Navigation has 12 items (exceeds 7±2 guideline)
3. No loading states for async actions

📋 RECOMMENDATIONS:

HIGH PRIORITY (Fix These First):
• Navigation contrast: Change #a0a0a0 to #595959 for 4.5:1 ratio
• Button sizing: Increase from 32px to 48px on mobile
• Form labels: Move from placeholder to persistent labels above fields

[Detailed code examples provided...]

MEDIUM PRIORITY:
• Standardize spacing to 8px scale
• Reorganize navigation into categories
• Add loading spinners/skeleton screens

LOW PRIORITY:
• Add microinteractions on hover
• Implement dark mode
• Add focus-visible states

Would you like me to provide specific code changes for any of these?
```

### Example 2: Accessibility Audit

```
Please review my application for accessibility issues
```

**Agent Response:**
```
I'll conduct a WCAG AA accessibility audit.

[Agent analyzes codebase]

**ACCESSIBILITY SCORE: 6/10**

❌ CRITICAL VIOLATIONS (WCAG A):
1. Images missing alt text (12 instances in index.html)
2. Form inputs missing labels (contact-form.html)
3. Color contrast failures (navigation, footer)

⚠️ IMPORTANT ISSUES (WCAG AA):
1. No skip to main content link
2. Focus indicators removed (outline: none without replacement)
3. Heading hierarchy skips levels (H1 → H3)

💡 ENHANCEMENT OPPORTUNITIES (WCAG AAA):
1. Could add high contrast mode option
2. Could respect prefers-reduced-motion
3. Could improve keyboard shortcuts documentation

[Detailed fixes with code examples...]
```

### Example 3: Mobile Review

```
Can you check if my design works well on mobile?
```

**Agent Response:**
```
I'll analyze mobile usability and responsiveness.

[Agent reviews mobile patterns]

**MOBILE SCORE: 8/10**

✅ DOING WELL:
1. Responsive grid adapts nicely
2. Images properly sized with srcset
3. Font sizes readable without zoom

⚠️ ISSUES:
1. Touch targets: Buttons are 38px (need 44px minimum)
2. Navigation: Hamburger menu has no visual indicator
3. Forms: Text inputs too narrow on small screens
4. Spacing: Elements too close together (only 4px between)

📱 RECOMMENDATIONS:

Touch Targets:
• Increase all interactive elements to 48px height
• Add 8px margin between tappable elements

Navigation:
• Add hamburger icon (☰) with "Menu" label
• Consider bottom tab bar pattern for main actions

Forms:
• Use full-width inputs on mobile
• Increase input height to 48px
• Show number keyboard for phone fields

[Code examples provided...]
```

### Example 4: Component Review

```
Review the design of my button components
```

**Agent Response:**
```
I'll analyze your button component design.

[Agent finds and reviews button patterns]

**BUTTON ANALYSIS**

CURRENT IMPLEMENTATION:
• Found in: src/components/Button.js
• Variants: primary, secondary, outline
• Sizes: small, medium, large

✅ STRENGTHS:
1. Good visual hierarchy between variants
2. Disabled state implemented
3. Consistent padding

⚠️ ISSUES:
1. Small buttons are 32x32px (need 44x44px minimum)
2. No loading state for async actions
3. No focus-visible state (accessibility issue)
4. Labels not verb-based ("Click here" instead of "Save Changes")

📋 RECOMMENDATIONS:

Size Improvements:
small: 44px height (was 32px)
medium: 48px height (was 40px)
large: 56px height (was 48px)

Add Loading State:
[Code example for loading spinner...]

Add Focus State:
.button:focus-visible {
  outline: 2px solid #2a5298;
  outline-offset: 2px;
}

Label Guidelines:
❌ "Click here", "OK", "Submit"
✅ "Save Changes", "Create Account", "Download Report"

[Complete code examples...]
```

## Advanced Usage

### Specific Focus Areas

```
Review my color palette for accessibility
Analyze my form design
Check my navigation against Miller's Law
Review my typography scale
Audit my spacing consistency
```

### Comparative Analysis

```
Compare my design to Material Design guidelines
How does my navigation compare to best practices?
Is my form design following industry standards?
```

### Implementation Guidance

```
How should I implement a design system?
What's the best way to organize my CSS?
How can I improve my component consistency?
```

## Agent Capabilities

### Can Analyze
- ✅ HTML, CSS, JavaScript, JSX, Vue, Svelte, any UI framework
- ✅ Color contrast and accessibility
- ✅ Layout and spacing consistency
- ✅ Typography hierarchy
- ✅ Interactive patterns (forms, buttons, navigation)
- ✅ Responsive design
- ✅ Component design

### Provides
- ✅ Specific code examples
- ✅ Before/after comparisons
- ✅ Priority rankings (High/Medium/Low)
- ✅ WCAG compliance checks
- ✅ Best practice references
- ✅ Tool and resource recommendations

### References
- Interaction Design Foundation research
- WCAG 2.1 Guidelines
- Material Design principles
- Apple Human Interface Guidelines
- Nielsen Norman Group usability research
- Industry design laws (Hick's, Miller's, Fitts')

## Tips for Best Results

### Be Specific
```
❌ "Review my design"
✅ "Review my navigation design for mobile usability"
✅ "Check if my form labels meet accessibility standards"
✅ "Analyze my button component for WCAG compliance"
```

### Provide Context
```
"Our target users are elderly (65+), so readability is critical"
"This is a mobile-first app for quick transactions"
"We need to meet WCAG AAA for government compliance"
```

### Ask Follow-ups
```
"Can you show me the code to fix the contrast issue?"
"What's a better alternative to the hamburger menu?"
"How would Material Design handle this pattern?"
```

## Integration with Development

### During Development
```
/ui-review
```
Get real-time feedback as you build

### Before Code Review
```
Please review the UI of my new feature branch
```
Catch issues before peer review

### Before Launch
```
Conduct a full accessibility audit before we ship
```
Final quality check

### After User Feedback
```
Users are confused by our navigation. Can you analyze it?
```
Diagnose usability issues

## Common Questions

**Q: How thorough is the analysis?**
A: The agent will explore your entire codebase and provide comprehensive analysis. You can request "quick", "medium", or "very thorough" depth.

**Q: Can it fix issues automatically?**
A: The agent provides detailed code examples and recommendations. You can ask it to make specific changes, or do it yourself.

**Q: Does it understand my specific framework?**
A: Yes, it can analyze React, Vue, Svelte, Angular, or any UI framework. It focuses on the rendered output and design principles.

**Q: Can it help create new designs?**
A: Yes! Ask it for recommendations when designing new features, components, or layouts.

**Q: Is it opinionated?**
A: It follows industry-standard best practices but can adapt to your needs. Ask questions to understand the reasoning behind recommendations.

## Example Scenarios

### Scenario 1: New Developer
```
"I'm new to UI design. Can you review my app and teach me best practices?"
```
Agent provides educational feedback with explanations

### Scenario 2: Accessibility Compliance
```
"We need to meet WCAG AA. Please audit our application."
```
Agent provides comprehensive accessibility report

### Scenario 3: Design System Creation
```
"Help me create a design system for our components"
```
Agent provides guidelines and examples

### Scenario 4: Performance Issues
```
"Users say our app feels slow. Can you review the UX?"
```
Agent checks loading states, feedback, perceived performance

### Scenario 5: Mobile Optimization
```
"Optimize our design for mobile users"
```
Agent reviews touch targets, navigation, readability

## Getting Started

1. **Try the slash command:**
   ```
   /ui-review
   ```

2. **Review the results** and prioritize fixes

3. **Ask for specific code examples:**
   ```
   "Show me how to fix the contrast issue in the navigation"
   ```

4. **Implement changes** and re-run the review

5. **Iterate** until you achieve your target score

## Resources

The agent can recommend:
- Contrast checkers (WebAIM, Stark)
- Design tools (Figma, Adobe XD)
- Color palette generators (Coolors, Adobe Color)
- Typography tools (Modular Scale, Type Scale)
- Accessibility testing (axe DevTools, WAVE, Lighthouse)
- Design systems (Material Design, Human Interface Guidelines)

---

**Ready to improve your UI/UX?** Type `/ui-review` to get started!
