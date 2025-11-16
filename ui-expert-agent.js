/**
 * UI Design Expert Agent
 * Based on research from Interaction Design Foundation
 *
 * An intelligent system that provides expert UI/UX guidance, analysis,
 * and recommendations based on industry best practices and design principles.
 */

class UIExpertAgent {
    constructor() {
        this.principles = {
            userCentered: {
                name: "User-Centered Design",
                description: "Users take just 50ms to assess visual appeal",
                guidelines: [
                    "Prioritize target audience needs and preferences",
                    "Focus on emotional connections beyond mechanics",
                    "Design for the user's mental model, not the system's",
                    "Conduct user research and testing regularly"
                ]
            },
            simplicity: {
                name: "Simplicity",
                description: "Clutter-free layouts enable quick information discovery",
                guidelines: [
                    "Remove unnecessary elements and decorations",
                    "Use clear visual hierarchy",
                    "Limit choices to prevent decision paralysis (Hick's Law)",
                    "Progressive disclosure: show only what's needed",
                    "One primary action per screen when possible"
                ]
            },
            consistency: {
                name: "Consistency",
                description: "Uniform design language across all screens/pages",
                guidelines: [
                    "Maintain consistent color schemes and typography",
                    "Use standardized spacing and layout patterns",
                    "Keep navigation patterns predictable",
                    "Ensure button styles and interactions are uniform",
                    "Follow platform conventions (iOS, Material Design, etc.)"
                ]
            },
            responsiveness: {
                name: "Responsiveness",
                description: "Adaptation across devices without quality loss",
                guidelines: [
                    "Mobile-first design approach",
                    "Flexible grids and layouts",
                    "Touch-friendly tap targets (min 44x44px)",
                    "Optimize images for different screen densities",
                    "Test on real devices, not just emulators"
                ]
            },
            feedback: {
                name: "Feedback",
                description: "Clear user action responses through animations or messages",
                guidelines: [
                    "Provide immediate visual feedback for all interactions",
                    "Use loading states for async operations",
                    "Show success/error messages clearly",
                    "Implement microinteractions for delight",
                    "Use animation duration of 200-500ms for optimal perception"
                ]
            }
        };

        this.visualElements = {
            typography: {
                recommendations: [
                    "Use 16px minimum for body text",
                    "Maintain 1.5-1.6 line height for readability",
                    "Limit to 2-3 font families maximum",
                    "Use font weights to create hierarchy",
                    "Ensure 45-75 characters per line for optimal reading"
                ]
            },
            color: {
                recommendations: [
                    "Use colors to evoke emotions and guide attention",
                    "Maintain 4.5:1 contrast ratio for normal text (WCAG AA)",
                    "Maintain 3:1 contrast ratio for large text",
                    "Use 60-30-10 rule: 60% primary, 30% secondary, 10% accent",
                    "Consider color blindness (use patterns or labels)",
                    "Limit palette to 5-7 colors maximum"
                ]
            },
            navigation: {
                recommendations: [
                    "Keep navigation visible and accessible",
                    "Use clear, descriptive labels",
                    "Provide breadcrumbs for deep hierarchies",
                    "Implement search for content-heavy sites",
                    "Show current location/active state",
                    "Limit main navigation to 7±2 items (Miller's Law)"
                ]
            },
            whitespace: {
                recommendations: [
                    "Use whitespace to create visual breathing room",
                    "Group related elements with proximity",
                    "Increase spacing between sections",
                    "Don't be afraid of empty space",
                    "Use consistent spacing scale (8px, 16px, 24px, 32px, etc.)"
                ]
            }
        };

        this.commonPatterns = {
            cards: "Contained content blocks with clear boundaries",
            modals: "Focused tasks without leaving context",
            dropdowns: "Space-efficient selection lists",
            tabs: "Organize related content without page loads",
            carousels: "Sequential content browsing (use sparingly)",
            tooltips: "Contextual help without cluttering UI",
            breadcrumbs: "Hierarchical navigation trail",
            progressIndicators: "Show multi-step process status"
        };

        this.accessibilityChecks = {
            contrast: "Check color contrast ratios",
            keyboard: "Ensure full keyboard navigation",
            screenReader: "Add ARIA labels and semantic HTML",
            focusStates: "Visible focus indicators for all interactive elements",
            altText: "Descriptive alt text for images",
            formLabels: "Proper labels for all form inputs",
            headingStructure: "Logical heading hierarchy (H1-H6)",
            skipLinks: "Skip to main content link"
        };
    }

    /**
     * Analyze a UI element or page
     * @param {Object} element - DOM element or description object
     * @returns {Object} Analysis results with recommendations
     */
    analyzeUI(element) {
        const analysis = {
            score: 0,
            strengths: [],
            issues: [],
            recommendations: [],
            accessibility: [],
            timestamp: new Date().toISOString()
        };

        // If element is a DOM node, analyze it
        if (element instanceof HTMLElement) {
            this._analyzeDOMElement(element, analysis);
        } else if (typeof element === 'object') {
            this._analyzeDescription(element, analysis);
        }

        // Calculate overall score
        analysis.score = this._calculateScore(analysis);

        return analysis;
    }

    /**
     * Private method to analyze DOM element
     */
    _analyzeDOMElement(element, analysis) {
        // Check color contrast
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;

        if (bgColor && textColor) {
            const contrast = this._calculateContrast(bgColor, textColor);
            if (contrast < 4.5) {
                analysis.issues.push(`Low color contrast: ${contrast.toFixed(2)}:1 (should be at least 4.5:1)`);
                analysis.accessibility.push("Improve text contrast for better readability");
            } else {
                analysis.strengths.push(`Good color contrast: ${contrast.toFixed(2)}:1`);
            }
        }

        // Check font size
        const fontSize = parseFloat(styles.fontSize);
        if (fontSize < 16) {
            analysis.issues.push(`Small font size: ${fontSize}px (recommended minimum: 16px)`);
            analysis.recommendations.push("Increase font size to at least 16px for better readability");
        } else {
            analysis.strengths.push(`Adequate font size: ${fontSize}px`);
        }

        // Check line height
        const lineHeight = parseFloat(styles.lineHeight) / fontSize;
        if (lineHeight < 1.5) {
            analysis.issues.push(`Tight line height: ${lineHeight.toFixed(2)} (recommended: 1.5-1.6)`);
            analysis.recommendations.push("Increase line-height to 1.5-1.6 for improved readability");
        } else {
            analysis.strengths.push(`Good line height: ${lineHeight.toFixed(2)}`);
        }

        // Check for ARIA labels
        if (element.hasAttribute('role') || element.hasAttribute('aria-label')) {
            analysis.strengths.push("Element has accessibility attributes");
        } else if (element.tagName === 'BUTTON' || element.tagName === 'A') {
            analysis.accessibility.push("Consider adding aria-label for screen reader users");
        }

        // Check button/link size for touch targets
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                analysis.issues.push(`Touch target too small: ${rect.width}x${rect.height}px (recommended: 44x44px minimum)`);
                analysis.recommendations.push("Increase touch target size to at least 44x44px");
            } else {
                analysis.strengths.push(`Adequate touch target size: ${rect.width}x${rect.height}px`);
            }
        }
    }

    /**
     * Private method to analyze description object
     */
    _analyzeDescription(description, analysis) {
        const {
            colors = [],
            fonts = [],
            spacing = null,
            navigation = null,
            responsiveness = null,
            feedback = null
        } = description;

        // Analyze color palette
        if (colors.length > 7) {
            analysis.issues.push(`Too many colors: ${colors.length} (recommended: 5-7 maximum)`);
            analysis.recommendations.push("Reduce color palette to 5-7 colors for consistency");
        } else if (colors.length > 0) {
            analysis.strengths.push(`Color palette size: ${colors.length} colors`);
        }

        // Analyze fonts
        if (fonts.length > 3) {
            analysis.issues.push(`Too many fonts: ${fonts.length} (recommended: 2-3 maximum)`);
            analysis.recommendations.push("Limit to 2-3 font families for visual consistency");
        } else if (fonts.length > 0) {
            analysis.strengths.push(`Font families: ${fonts.length} (good)`);
        }

        // Analyze spacing
        if (spacing === 'inconsistent') {
            analysis.issues.push("Inconsistent spacing detected");
            analysis.recommendations.push("Use a consistent spacing scale (e.g., 8px, 16px, 24px, 32px)");
        } else if (spacing === 'consistent') {
            analysis.strengths.push("Consistent spacing system in place");
        }

        // Analyze navigation
        if (navigation && navigation.itemCount > 9) {
            analysis.issues.push(`Too many navigation items: ${navigation.itemCount} (recommended: 7±2)`);
            analysis.recommendations.push("Reduce navigation items or group them into categories");
        } else if (navigation && navigation.itemCount > 0) {
            analysis.strengths.push(`Navigation item count: ${navigation.itemCount} (optimal)`);
        }

        // Analyze responsiveness
        if (responsiveness === false) {
            analysis.issues.push("Not responsive to different screen sizes");
            analysis.recommendations.push("Implement responsive design with mobile-first approach");
        } else if (responsiveness === true) {
            analysis.strengths.push("Responsive design implemented");
        }

        // Analyze feedback
        if (feedback === false) {
            analysis.issues.push("Lacking user feedback mechanisms");
            analysis.recommendations.push("Add visual feedback for user interactions (hover states, loading indicators, etc.)");
        } else if (feedback === true) {
            analysis.strengths.push("User feedback mechanisms in place");
        }
    }

    /**
     * Calculate overall UI score
     */
    _calculateScore(analysis) {
        const maxScore = 100;
        let score = maxScore;

        // Deduct points for issues
        score -= analysis.issues.length * 10;

        // Deduct points for missing accessibility features
        score -= analysis.accessibility.length * 5;

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        return score;
    }

    /**
     * Calculate color contrast ratio
     * Simplified version - for production use a library like 'color-contrast'
     */
    _calculateContrast(color1, color2) {
        // This is a simplified version
        // In production, use proper color contrast calculation
        // Following WCAG guidelines

        const getLuminance = (color) => {
            // Parse RGB values
            const rgb = color.match(/\d+/g);
            if (!rgb || rgb.length < 3) return 0.5;

            const [r, g, b] = rgb.map(val => {
                const v = parseInt(val) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Get design recommendations for specific UI patterns
     */
    getPatternRecommendations(patternType) {
        const patterns = {
            form: {
                recommendations: [
                    "Group related fields together",
                    "Use clear, descriptive labels above or beside inputs",
                    "Provide inline validation with helpful error messages",
                    "Show password strength indicators",
                    "Use appropriate input types (email, tel, number)",
                    "Mark required fields clearly (* or 'required' label)",
                    "Provide a clear call-to-action button",
                    "Show progress for multi-step forms"
                ]
            },
            card: {
                recommendations: [
                    "Use consistent padding (e.g., 16-24px)",
                    "Add subtle shadows for depth (box-shadow: 0 2px 8px rgba(0,0,0,0.1))",
                    "Include clear headings and hierarchy",
                    "Limit content to focus on one main action",
                    "Make entire card clickable if it leads somewhere",
                    "Use hover states for interactive cards",
                    "Maintain consistent border radius (e.g., 8px)"
                ]
            },
            button: {
                recommendations: [
                    "Use clear, action-oriented labels (e.g., 'Save Changes' not 'OK')",
                    "Ensure minimum size of 44x44px for touch targets",
                    "Provide distinct visual styles for primary, secondary, and tertiary actions",
                    "Add hover and active states",
                    "Use loading states for async actions",
                    "Include disabled states with reduced opacity",
                    "Consider icon + text for clarity",
                    "Group related actions together"
                ]
            },
            navigation: {
                recommendations: [
                    "Keep primary navigation always visible",
                    "Use hamburger menu only on mobile",
                    "Highlight current page/section",
                    "Provide clear visual separation between nav items",
                    "Use familiar icons (home, search, settings)",
                    "Implement breadcrumbs for deep hierarchies",
                    "Add search for content-heavy sites",
                    "Consider sticky navigation for long pages"
                ]
            },
            modal: {
                recommendations: [
                    "Use modals for focused tasks only",
                    "Provide clear close button (X in top-right)",
                    "Allow closing via ESC key and backdrop click",
                    "Trap keyboard focus within modal",
                    "Darken/blur background (overlay)",
                    "Keep content focused and concise",
                    "Use clear action buttons at bottom",
                    "Prevent body scroll when modal is open"
                ]
            },
            table: {
                recommendations: [
                    "Make tables responsive (horizontal scroll or cards on mobile)",
                    "Use zebra striping for better readability",
                    "Add hover states for rows",
                    "Enable sorting for columns",
                    "Implement pagination for large datasets",
                    "Use filters and search for data exploration",
                    "Align numbers to the right, text to the left",
                    "Highlight selected rows clearly"
                ]
            }
        };

        return patterns[patternType] || { recommendations: ["Pattern not found in database"] };
    }

    /**
     * Generate accessibility checklist
     */
    getAccessibilityChecklist() {
        return {
            critical: [
                "✓ All images have descriptive alt text",
                "✓ Color contrast ratios meet WCAG AA standards (4.5:1)",
                "✓ All interactive elements are keyboard accessible",
                "✓ Forms have proper labels and error messages",
                "✓ Page has a logical heading structure (H1-H6)"
            ],
            important: [
                "✓ Focus indicators are visible",
                "✓ ARIA labels for complex interactions",
                "✓ Skip to main content link provided",
                "✓ No content flashing more than 3 times per second",
                "✓ Sufficient spacing between interactive elements"
            ],
            enhanced: [
                "✓ Dark mode option available",
                "✓ Font size can be increased without breaking layout",
                "✓ Reduced motion option for animations",
                "✓ Screen reader tested and optimized",
                "✓ Touch targets minimum 44x44px"
            ]
        };
    }

    /**
     * Get microinteraction suggestions
     */
    getMicrointeractionSuggestions() {
        return {
            buttonClick: {
                description: "Visual feedback when button is clicked",
                implementation: "Scale down slightly (transform: scale(0.95)) for 100ms"
            },
            hoverEffect: {
                description: "Subtle elevation on hover",
                implementation: "Increase box-shadow and slightly translate up (transform: translateY(-2px))"
            },
            loadingState: {
                description: "Show activity during async operations",
                implementation: "Spinner or skeleton screens, disable interaction during load"
            },
            successFeedback: {
                description: "Confirm successful actions",
                implementation: "Green checkmark animation, toast notification, or subtle color change"
            },
            errorFeedback: {
                description: "Alert users to errors",
                implementation: "Red shake animation, error icon, clear error message"
            },
            dragAndDrop: {
                description: "Visual feedback during drag operations",
                implementation: "Ghost element, drop zone highlights, smooth transitions"
            },
            formValidation: {
                description: "Inline validation as user types",
                implementation: "Show checkmarks for valid fields, errors below invalid fields"
            },
            pageTransition: {
                description: "Smooth transitions between pages/states",
                implementation: "Fade in/out, slide animations (200-300ms duration)"
            }
        };
    }

    /**
     * Generate comprehensive UI audit report
     */
    generateAuditReport(pageDescription) {
        const report = {
            timestamp: new Date().toISOString(),
            overview: {},
            principles: {},
            recommendations: [],
            accessibility: [],
            priorityActions: []
        };

        // Analyze against each principle
        for (const [key, principle] of Object.entries(this.principles)) {
            report.principles[key] = {
                name: principle.name,
                status: 'needs_review',
                notes: []
            };
        }

        // Add general recommendations
        report.recommendations = [
            "Conduct user testing with target audience",
            "Implement A/B testing for critical UI elements",
            "Measure and optimize page load times",
            "Ensure mobile responsiveness across devices",
            "Add analytics to track user behavior",
            "Create a design system for consistency",
            "Document UI patterns and components"
        ];

        // Add accessibility recommendations
        report.accessibility = Object.keys(this.accessibilityChecks).map(check => ({
            check: check,
            description: this.accessibilityChecks[check],
            status: 'pending'
        }));

        // Define priority actions
        report.priorityActions = [
            {
                priority: 'high',
                action: 'Fix color contrast issues',
                impact: 'Critical for accessibility and readability'
            },
            {
                priority: 'high',
                action: 'Ensure keyboard navigation works',
                impact: 'Essential for accessibility'
            },
            {
                priority: 'medium',
                action: 'Optimize for mobile devices',
                impact: 'Large portion of users on mobile'
            },
            {
                priority: 'medium',
                action: 'Add loading states and feedback',
                impact: 'Improves perceived performance'
            },
            {
                priority: 'low',
                action: 'Implement microinteractions',
                impact: 'Enhances user delight'
            }
        ];

        return report;
    }

    /**
     * Get design system suggestions
     */
    getDesignSystemGuidelines() {
        return {
            colors: {
                structure: "Define primary, secondary, accent, neutral, success, warning, error, and info colors",
                implementation: "Use CSS custom properties (variables) for easy theming"
            },
            typography: {
                scale: "Use modular scale (e.g., 12px, 14px, 16px, 18px, 24px, 32px, 48px)",
                weights: "Define font weights for different hierarchy levels (e.g., 400, 500, 600, 700)"
            },
            spacing: {
                scale: "Use consistent spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)",
                application: "Apply to margin, padding, and gap properties"
            },
            borderRadius: {
                values: "Define set of border radius values (e.g., 4px, 8px, 16px, 24px)",
                usage: "Use consistently across buttons, cards, inputs"
            },
            shadows: {
                levels: "Create elevation system with different shadow levels (1-5)",
                usage: "Apply consistently to modals, dropdowns, cards"
            },
            animation: {
                duration: "Define timing values (fast: 150ms, normal: 250ms, slow: 400ms)",
                easing: "Use consistent easing functions (ease-in-out, cubic-bezier)"
            },
            breakpoints: {
                mobile: "320px - 767px",
                tablet: "768px - 1023px",
                desktop: "1024px - 1439px",
                wide: "1440px+"
            }
        };
    }

    /**
     * Provide real-time design feedback
     */
    provideFeedback(action, context = {}) {
        const feedback = {
            action: action,
            feedback: [],
            suggestions: [],
            resources: []
        };

        const feedbackMap = {
            'choosing-colors': {
                feedback: [
                    "Consider your brand identity and target audience emotions",
                    "Use color psychology: Blue = trust, Green = growth, Red = urgency",
                    "Ensure sufficient contrast (4.5:1 for text)"
                ],
                suggestions: [
                    "Use tools like Adobe Color or Coolors for palette generation",
                    "Test with color blindness simulators",
                    "Limit to 5-7 colors maximum"
                ],
                resources: [
                    "Material Design Color Tool",
                    "WebAIM Contrast Checker",
                    "Coolors.co palette generator"
                ]
            },
            'designing-form': {
                feedback: [
                    "Group related fields together",
                    "Use inline validation for immediate feedback",
                    "Make labels clear and descriptive"
                ],
                suggestions: [
                    "Place labels above fields for better mobile experience",
                    "Use appropriate input types (email, tel, number)",
                    "Provide clear error messages with solutions"
                ],
                resources: [
                    "Form Design Best Practices by Nielsen Norman Group",
                    "Material Design Form Guidelines"
                ]
            },
            'creating-navigation': {
                feedback: [
                    "Keep main navigation items to 7±2 for optimal recall",
                    "Ensure navigation is visible and accessible",
                    "Highlight current location"
                ],
                suggestions: [
                    "Use descriptive labels, avoid jargon",
                    "Implement breadcrumbs for deep hierarchies",
                    "Consider mega menus for complex sites"
                ],
                resources: [
                    "Navigation Design Patterns",
                    "NN/g Navigation Guidelines"
                ]
            },
            'optimizing-performance': {
                feedback: [
                    "Target under 3 seconds for page load time",
                    "Use lazy loading for images and components",
                    "Minimize and compress assets"
                ],
                suggestions: [
                    "Implement code splitting",
                    "Use CDN for static assets",
                    "Optimize images (WebP format, proper sizing)"
                ],
                resources: [
                    "Google PageSpeed Insights",
                    "WebPageTest.org",
                    "Lighthouse performance audits"
                ]
            }
        };

        const actionFeedback = feedbackMap[action];
        if (actionFeedback) {
            feedback.feedback = actionFeedback.feedback;
            feedback.suggestions = actionFeedback.suggestions;
            feedback.resources = actionFeedback.resources;
        } else {
            feedback.feedback = ["Please provide more context about your design challenge"];
        }

        return feedback;
    }

    /**
     * Get quick tips
     */
    getQuickTips(category = 'general') {
        const tips = {
            general: [
                "Users spend 80% of their time on other websites - use familiar patterns",
                "Every element should have a purpose - if in doubt, leave it out",
                "Test early, test often - don't wait until the end",
                "Accessibility benefits everyone, not just users with disabilities",
                "The best design is invisible - users shouldn't notice the UI"
            ],
            mobile: [
                "Design for thumbs - place important actions in easy reach",
                "Touch targets should be minimum 44x44px",
                "Reduce text input - use selection controls when possible",
                "Consider one-handed use for common tasks",
                "Test on real devices with real content"
            ],
            performance: [
                "Users abandon sites that take >3 seconds to load",
                "Perceived performance matters as much as actual performance",
                "Use skeleton screens instead of spinners when possible",
                "Optimize critical rendering path",
                "Measure real user metrics, not just lab metrics"
            ],
            accessibility: [
                "Keyboard navigation should work for all functionality",
                "Color alone should never convey information",
                "Text should be resizable up to 200% without breaking layout",
                "Provide text alternatives for non-text content",
                "Use semantic HTML for better screen reader support"
            ],
            typography: [
                "Line length should be 45-75 characters for optimal reading",
                "Line height should be 1.5-1.6 for body text",
                "Don't use all caps for long text - it's harder to read",
                "Ensure sufficient contrast between text and background",
                "Use real text instead of images of text when possible"
            ]
        };

        return tips[category] || tips.general;
    }

    /**
     * Interactive consultation - ask the agent questions
     */
    consult(question) {
        const responses = {
            'how to improve conversion': {
                answer: "To improve conversion rates, focus on these key areas:",
                points: [
                    "Simplify the user journey - reduce steps to conversion",
                    "Use clear, action-oriented CTAs (calls-to-action)",
                    "Build trust with social proof, testimonials, security badges",
                    "Optimize page load speed",
                    "A/B test headlines, CTAs, and layouts",
                    "Reduce form fields to essentials only",
                    "Provide clear value proposition above the fold",
                    "Use urgency and scarcity wisely (not manipulatively)"
                ]
            },
            'mobile vs desktop': {
                answer: "Design for both with a mobile-first approach:",
                points: [
                    "Start with mobile constraints, then enhance for larger screens",
                    "Touch targets on mobile should be larger (44x44px minimum)",
                    "Navigation may need to be simplified on mobile (hamburger menu)",
                    "Consider connection speed - mobile often has slower connections",
                    "Test gestures on mobile (swipe, pinch, long-press)",
                    "Desktop can show more information density",
                    "Use responsive images and layouts",
                    "Consider context: mobile users may be on-the-go, desktop users may be more focused"
                ]
            },
            'choosing colors': {
                answer: "Color selection should be strategic:",
                points: [
                    "Start with your brand colors if you have them",
                    "Use color psychology: Blue = trust, Green = success, Red = urgency/error",
                    "Create a 60-30-10 palette: 60% primary, 30% secondary, 10% accent",
                    "Ensure 4.5:1 contrast ratio for text",
                    "Test with color blindness simulators (8% of men have color blindness)",
                    "Use colors consistently (e.g., always green for success)",
                    "Consider cultural associations of colors",
                    "Limit palette to 5-7 colors for consistency"
                ]
            },
            'improving ux': {
                answer: "UX improvement is an ongoing process:",
                points: [
                    "Conduct user research - talk to real users",
                    "Create user personas and journey maps",
                    "Use analytics to identify pain points",
                    "Implement usability testing regularly",
                    "Follow established design patterns",
                    "Reduce cognitive load - don't make users think",
                    "Provide clear feedback for all actions",
                    "Make error messages helpful, not blaming",
                    "Measure and iterate based on data"
                ]
            }
        };

        // Find matching response
        const normalizedQuestion = question.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (normalizedQuestion.includes(key) || key.includes(normalizedQuestion.substring(0, 15))) {
                return response;
            }
        }

        // Default response
        return {
            answer: "I'd be happy to help! Here are some general UI/UX principles:",
            points: this.getQuickTips('general')
        };
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIExpertAgent;
}

// Create global instance for browser use
if (typeof window !== 'undefined') {
    window.UIExpertAgent = UIExpertAgent;
    window.uiExpert = new UIExpertAgent();
    console.log('UI Expert Agent loaded! Use window.uiExpert to access it.');
}
