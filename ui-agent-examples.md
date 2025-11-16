# UI Expert Agent - Usage Examples

Real-world examples of how to use the UI/UX Expert Agent in different scenarios.

## Quick Examples

### 1. General UI Review
```
/ui-review
```
OR
```
Please invoke the UI expert agent to review my application
```

### 2. Accessibility Audit
```
Can the UI expert agent audit my app for WCAG AA compliance?
```

### 3. Mobile Optimization
```
Please review my mobile design for usability issues
```

### 4. Component Analysis
```
Analyze my button components for best practices
```

### 5. Color Contrast Check
```
Check if my color palette meets accessibility standards
```

## Detailed Examples

### Example 1: First-Time User

**User:** "I just built my first website. Can someone review it?"

**Command:**
```
Please invoke the UI expert agent to give me a beginner-friendly review of my website with educational explanations
```

**Agent Response:**
```
I'll review your website with detailed explanations to help you learn UI/UX principles.

[Explores codebase thoroughly]

🎓 LEARNING-FOCUSED REVIEW

**Overall Score: 6.5/10 - Good start with room for improvement!**

Let me explain what's working and what needs attention:

✅ WHAT YOU'RE DOING WELL:

1. **Clean Layout** ✓
   Your content is well-organized in sections. This is called "visual hierarchy."
   Why it matters: Users scan in F-patterns, so logical sections help them find info fast.

2. **Readable Font Size** ✓
   Your body text is 18px, which exceeds the 16px minimum.
   Why it matters: Smaller text strains eyes, especially on mobile devices.

3. **Consistent Button Style** ✓
   All your buttons have the same look and feel.
   Why it matters: Consistency helps users learn your interface faster.

❌ CRITICAL ISSUES (Fix These First):

1. **Color Contrast Problem** ❌
   Location: Navigation text (nav.css line 15)
   Current: Light gray (#aaa) on white background
   Contrast ratio: 2.1:1
   Required: 4.5:1 (WCAG AA standard)

   What this means: People with vision impairments can't read this text.
   About 1 in 5 people have vision issues - that's 20% of your users!

   How to fix:
   ```css
   /* Change from: */
   nav a { color: #aaa; }

   /* Change to: */
   nav a { color: #595959; }
   ```

   This simple change gets you to 4.5:1 ratio ✓

2. **Missing Alt Text on Images** ❌
   Location: index.html lines 45, 67, 89
   Current: <img src="photo.jpg">
   Problem: Screen readers can't describe these to blind users

   How to fix:
   ```html
   <!-- Describe what's IN the image -->
   <img src="photo.jpg" alt="Team celebrating product launch in office">
   ```

   Not just: alt="photo" - that's not helpful!

[... continues with educational explanations for each issue ...]

🎯 YOUR ACTION PLAN:

Week 1 (Critical):
□ Fix color contrast in navigation
□ Add alt text to all 12 images
□ Fix form labels (currently inside fields, should be above)

Week 2 (Important):
□ Increase button size on mobile from 36px to 44px
□ Add loading spinner to "Submit" button
□ Fix heading order (you skip from H1 to H3)

Week 3 (Nice to Have):
□ Add hover effects to links
□ Consider adding a "back to top" button
□ Add smooth scrolling

📚 LEARNING RESOURCES:

• Color Contrast: WebAIM Contrast Checker
• Accessibility: MDN Web Accessibility Guide
• Layout: CSS-Tricks Guide to Flexbox
• Typography: Practical Typography by Matthew Butterick

Want me to explain any of these concepts in more detail?
```

---

### Example 2: E-commerce Site

**User:** "I run an e-commerce site. Conversion rates are low. Can you help?"

**Command:**
```
Please analyze my e-commerce site for conversion optimization, focusing on checkout flow and product pages
```

**Agent Response:**
```
I'll analyze your e-commerce UX with focus on conversion optimization.

[Explores site, pays special attention to checkout and product pages]

🛒 E-COMMERCE UX AUDIT

**Conversion Impact Score: 5/10 - Significant opportunities**

💰 HIGH-IMPACT ISSUES (Hurting Conversions):

1. **Checkout: Too Many Form Fields** ❌
   Current: 14 required fields
   Best practice: 6-8 fields maximum
   Impact: Each extra field reduces conversion ~3-5%

   RECOMMENDED: Make these optional or remove:
   • Company name (optional for B2C)
   • Phone number (only if shipping requires it)
   • Address line 2 (make optional)
   • Fax number (remove - it's 2025!)

   Keep required: Email, Name, Address, City, ZIP, Payment

2. **Product Pages: Missing Trust Signals** ❌
   Current: No reviews, no badges, no return policy visible
   Impact: 70% of users check reviews before buying

   ADD:
   • Star ratings (visible above fold)
   • Review count ("Based on 234 reviews")
   • Trust badges (Secure checkout, Money-back guarantee)
   • Return policy link (near Add to Cart button)

3. **Mobile: Tiny "Add to Cart" Button** ❌
   Current size: 32px × 38px
   Required: 44px × 44px minimum
   Impact: Users miss the button, get frustrated, leave

   Fix:
   ```css
   .add-to-cart-btn {
     min-height: 48px;
     width: 100%;
     font-size: 18px;
     font-weight: 600;
   }
   ```

4. **Checkout: No Progress Indicator** ❌
   Users don't know: How many steps? How long will this take?
   Impact: 20% abandon due to uncertainty

   ADD:
   Step 1: Shipping → Step 2: Payment → Step 3: Review
   [====== -------- --------]

5. **Cart: No Visual Feedback on "Add"** ❌
   Current: No confirmation when item added
   Impact: Users click multiple times, order duplicates, get angry

   FIX: Add animation + notification:
   ```javascript
   // Show toast notification
   showToast("✓ Added to cart");

   // Animate cart icon
   cartIcon.classList.add('bounce');

   // Update count
   updateCartBadge();
   ```

💳 CHECKOUT FLOW SPECIFIC:

Issues Found:
1. Login required before checkout (let guests checkout!)
2. Shipping and billing on same page (too overwhelming)
3. No saved payment options (make returning easy)
4. Error messages unclear ("Error 422" - what??)
5. No security badges at payment step

Recommended Flow:
```
Step 1: Email + Guest/Account choice
  → Save to account optional, not required
  → Show: "Free shipping over $50" to motivate

Step 2: Shipping Address
  → Autofill from ZIP code
  → Show estimated delivery date
  → Offer to save address

Step 3: Payment
  → Show security badges (SSL, PCI compliant)
  → Offer to save card (opt-in)
  → Clear error messages: "Card number must be 16 digits"

Step 4: Review
  → Edit links for each section
  → Clear summary: items, shipping, tax, total
  → Large "Place Order" button

After: Confirmation
  → Order number prominently displayed
  → Estimated delivery
  → Clear next steps
```

🎨 PRODUCT PAGE OPTIMIZATION:

Current Issues:
1. Images too small (400px - should be 800px+)
2. No image zoom on hover
3. "Add to Cart" button below fold on mobile
4. No size guide for clothing
5. No "recently viewed" section

Recommended Layout:
```
[Large product image - 60% of screen]
  ↳ Thumbnails below
  ↳ Zoom on hover
  ↳ 360° view if available

[Product Details - Right side]
  Product name (H1)
  ★★★★☆ (234 reviews) ← Link to reviews
  Price (large, bold)
  Color/Size selector
  [Add to Cart - Full width, prominent]
  ✓ Free shipping over $50
  ✓ 30-day returns
  ✓ Secure checkout

[Tabs Below]
  Description | Reviews | Shipping | Size Guide
```

📊 QUICK WINS (Implement This Week):

□ Reduce checkout form fields from 14 to 7
□ Increase "Add to Cart" button to 48px height
□ Add progress indicator to checkout
□ Show "Added to cart" confirmation
□ Add star ratings to product pages
□ Make checkout guest-friendly
□ Show free shipping threshold

🎯 CONVERSION OPTIMIZATIONS:

HIGH PRIORITY:
• Add exit-intent popup for cart abandonment (recover ~5-10%)
• Show "Only 3 left in stock" for urgency (when true!)
• Add "Customers also bought" section
• Implement one-click reorder for returning customers

MEDIUM PRIORITY:
• A/B test button colors (test red vs green for Add to Cart)
• Add live chat for pre-sale questions
• Show estimated delivery date on product pages
• Add wishlist functionality

LOW PRIORITY:
• Add product videos
• Implement AR try-on (if relevant)
• Add gift wrapping option
• Create loyalty program

📈 EXPECTED IMPACT:

If you implement the high-priority items:
• Form reduction: +15-20% conversion
• Trust signals: +10-15% conversion
• Mobile button fix: +5-8% conversion
• Progress indicator: +3-5% conversion
• Add to cart feedback: +2-3% bounce reduction

Combined potential: +30-40% conversion improvement

Want me to show you how to implement any of these specific changes?
```

---

### Example 3: Accessibility Compliance for Government Site

**User:** "We need to meet WCAG AA for government compliance. Full audit please."

**Command:**
```
Conduct a comprehensive WCAG AA accessibility audit of my application. We need full compliance for government requirements.
```

**Agent Response:**
```
I'll conduct a thorough WCAG 2.1 Level AA compliance audit.

[Performs very thorough accessibility analysis]

♿ WCAG 2.1 LEVEL AA COMPLIANCE AUDIT

**Overall Compliance: 62% - Requires remediation before approval**

🚫 CRITICAL VIOLATIONS (Must Fix - Level A):

These are legal requirements and will fail accessibility compliance:

1. **Perceivable > 1.1.1 Non-text Content** ❌
   Violation: Images missing alt text
   Found: 47 instances across 8 pages
   Impact: Blind users cannot access content
   Legal risk: ADA violation

   Files requiring fixes:
   • index.html: lines 23, 45, 67, 89, 102
   • about.html: lines 34, 56, 78
   • services.html: 12 instances
   [Complete list in details...]

   How to fix:
   ```html
   <!-- Bad -->
   <img src="chart.png">

   <!-- Good -->
   <img src="chart.png" alt="Sales increased 42% from Q1 to Q2">

   <!-- Decorative images -->
   <img src="decoration.png" alt="">
   ```

2. **Operable > 2.1.1 Keyboard** ❌
   Violation: Interactive elements not keyboard accessible
   Found: Custom dropdowns, modal close buttons, carousel
   Impact: Keyboard-only users cannot navigate site

   Example issue (services.html, line 145):
   ```html
   <!-- This div is not keyboard accessible -->
   <div class="dropdown" onclick="toggleMenu()">
   ```

   How to fix:
   ```html
   <!-- Use button element -->
   <button class="dropdown"
           onclick="toggleMenu()"
           onkeydown="handleKeydown(event)"
           aria-expanded="false"
           aria-haspopup="true">
   ```

3. **Understandable > 3.3.2 Labels or Instructions** ❌
   Violation: Form inputs missing labels
   Found: Contact form, search box, newsletter signup
   Impact: Screen reader users don't know what to enter

   Current (contact.html):
   ```html
   <input type="text" placeholder="Enter your name">
   ```

   Required:
   ```html
   <label for="name">Full Name</label>
   <input type="text"
          id="name"
          name="name"
          placeholder="Enter your name"
          required
          aria-required="true">
   ```

4. **Perceivable > 1.4.3 Contrast (Minimum)** ❌
   Violation: Insufficient color contrast
   Found: 23 instances of text below 4.5:1 ratio

   Critical areas:
   • Navigation links: 2.1:1 (need 4.5:1) ← CRITICAL
   • Footer text: 3.2:1 (need 4.5:1)
   • Button text: 2.8:1 (need 4.5:1)
   • Help text: 3.9:1 (need 4.5:1)

   Code fixes:
   ```css
   /* Navigation - BEFORE */
   nav a {
     color: #999; /* Fails: 2.1:1 */
   }

   /* Navigation - AFTER */
   nav a {
     color: #595959; /* Passes: 4.5:1 ✓ */
   }

   /* Buttons - BEFORE */
   .btn-primary {
     background: #5eb3f6;
     color: white; /* Fails: 2.8:1 */
   }

   /* Buttons - AFTER */
   .btn-primary {
     background: #0277bd;
     color: white; /* Passes: 4.5:1 ✓ */
   }
   ```

⚠️ LEVEL AA VIOLATIONS (Required for Compliance):

5. **Operable > 2.4.7 Focus Visible** ❌
   Violation: Focus indicators removed globally
   Found: CSS reset removes all outlines
   Impact: Keyboard users can't see where they are

   Problem (styles.css, line 5):
   ```css
   * {
     outline: none; /* ← REMOVES FOCUS INDICATORS */
   }
   ```

   Solution:
   ```css
   /* Remove the global outline: none */

   /* Add custom focus styles */
   :focus-visible {
     outline: 2px solid #0066cc;
     outline-offset: 2px;
   }

   /* Specific elements */
   button:focus-visible,
   a:focus-visible,
   input:focus-visible {
     outline: 2px solid #0066cc;
     outline-offset: 2px;
     box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
   }
   ```

6. **Operable > 2.4.6 Headings and Labels** ❌
   Violation: Heading levels skip (H1 → H3, missing H2)
   Found: All pages have heading structure issues
   Impact: Screen reader users cannot navigate efficiently

   Current structure (about.html):
   ```html
   <h1>About Us</h1>
   <h3>Our Mission</h3>  ← SKIPS H2
   <h3>Our Values</h3>
   <h4>Integrity</h4>
   <h4>Innovation</h4>
   ```

   Correct structure:
   ```html
   <h1>About Us</h1>
   <h2>Our Mission</h2>
   <h2>Our Values</h2>
   <h3>Integrity</h3>
   <h3>Innovation</h3>
   ```

7. **Operable > 2.4.4 Link Purpose (In Context)** ❌
   Violation: Generic link text
   Found: 18 "click here" and "read more" links
   Impact: Screen reader link lists are not useful

   Bad:
   ```html
   <a href="/report.pdf">Click here</a> for the annual report
   ```

   Good:
   ```html
   <a href="/report.pdf">Download 2024 annual report (PDF, 2.3MB)</a>
   ```

8. **Perceivable > 1.3.1 Info and Relationships** ❌
   Violation: Data tables missing proper markup
   Found: Layout tables with data, missing th/scope
   Impact: Screen readers cannot understand table structure

   Current (data.html):
   ```html
   <table>
     <tr>
       <td>Name</td>
       <td>Department</td>
       <td>Email</td>
     </tr>
   ```

   Required:
   ```html
   <table>
     <caption>Employee Directory</caption>
     <thead>
       <tr>
         <th scope="col">Name</th>
         <th scope="col">Department</th>
         <th scope="col">Email</th>
       </tr>
     </thead>
     <tbody>
       <!-- data rows -->
     </tbody>
   </table>
   ```

📋 COMPLIANCE CHECKLIST:

**Level A (Must Fix):**
□ Add alt text to all 47 images
□ Make all interactive elements keyboard accessible
□ Add labels to all form inputs
□ Fix all color contrast violations (23 instances)
□ Add language attribute to HTML (<html lang="en">)
□ Ensure no content relies on color alone

**Level AA (Must Fix):**
□ Add visible focus indicators
□ Fix heading hierarchy on all pages
□ Replace generic link text
□ Add proper table markup
□ Add skip to main content link
□ Ensure text can resize to 200% without breaking

🔧 REMEDIATION PLAN:

**Week 1: Critical Fixes**
1. Alt text for all images (4 hours)
2. Color contrast fixes (3 hours)
3. Form labels (2 hours)
4. Focus indicators (2 hours)

**Week 2: Keyboard & Structure**
5. Keyboard navigation fixes (6 hours)
6. Heading hierarchy (3 hours)
7. Table markup (2 hours)

**Week 3: Polish & Test**
8. Link text improvements (2 hours)
9. Skip links (1 hour)
10. ARIA labels where needed (3 hours)
11. Full accessibility test (4 hours)

**Total effort: ~32 hours**

🧪 TESTING REQUIREMENTS:

Before submitting for compliance:

□ Keyboard test: Navigate entire site with Tab/Shift+Tab/Enter
□ Screen reader test: NVDA (free) or JAWS
□ Color contrast: Run WebAIM contrast checker on all text
□ Automated scan: axe DevTools (browser extension)
□ Manual audit: Review against WCAG 2.1 checklist
□ User test: Have someone with disabilities test it

📊 COMPLIANCE STATUS BY PAGE:

index.html: 58% compliant
about.html: 61% compliant
services.html: 52% compliant ← Worst
contact.html: 67% compliant
blog.html: 71% compliant ← Best

🎯 AFTER REMEDIATION:

Expected compliance: 95%+

Remaining 5% will likely be:
• Edge cases requiring judgment
• Third-party widgets (chat, maps)
• PDF documents (require separate remediation)

📄 DELIVERABLES NEEDED:

For government approval, provide:
1. VPAT (Voluntary Product Accessibility Template)
2. Accessibility conformance statement
3. Test results from axe DevTools
4. Remediation completion report

Want me to:
1. Provide code fixes for all violations?
2. Generate the VPAT document?
3. Create an accessibility testing checklist?
```

---

## More Quick Examples

### Typography Review
```
Review my typography for readability and hierarchy
```

### Color Palette Analysis
```
Analyze my color palette - is it consistent and accessible?
```

### Form Design
```
Review my contact form against best practices
```

### Navigation Structure
```
Analyze my navigation - is it intuitive?
```

### Performance UX
```
Review my loading states and perceived performance
```

### Design System Help
```
Help me create a design system for my components
```

---

Ready to try it? Just type **`/ui-review`** in Claude Code!
