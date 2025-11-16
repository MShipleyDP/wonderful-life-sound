# Admin Panel Reorganization Plan

## Current Problems

### Tab Structure Issues:
1. **Batch Import Tab is Bloated** - Contains 4 different tools:
   - API Key management
   - AI Prompt Generator
   - Freesound Search
   - JSON Import
   - This is ~350 lines of dense UI in ONE tab

2. **No Logical Grouping**:
   - "Director's Selections" and "Statistics" are related but separate
   - "Manage Sounds" mixes upload + browse + delete
   - "Flagged for Deletion" is sound management but lives separately

3. **Flat Navigation**:
   - All 5 tabs at same level
   - No sub-navigation for complex workflows
   - Hard to remember where features live

## Proposed Solution: 3-Tier Navigation

### Tier 1: Main Tabs (Top Level)
```
📊 Director Review | 🎵 Sound Library | 📥 Import Tools
```

### Tier 2: Sub-Tabs (Contextual)
Each main tab has focused sub-sections:

#### **📊 Director Review** (Read-only analytics)
- Overview (Combined stats + recent activity)
- Favorites
- Ratings
- Notes

#### **🎵 Sound Library** (CRUD operations)
- Browse & Listen
- Upload New
- Flagged Items

#### **📥 Import Tools** (Batch operations)
- Setup (API Keys)
- AI Generator
- Freesound Search
- JSON Import

## Visual Hierarchy

### Main Tabs (Tier 1)
- Large, prominent
- Icons + Labels
- Red accent on active

### Sub-Tabs (Tier 2)
- Smaller, pill-style
- Below main tabs
- Subtle active state
- Only show when parent tab active

## Benefits

✅ **Reduced Cognitive Load**: Each screen has ONE job
✅ **Progressive Disclosure**: Advanced features hidden until needed
✅ **Logical Grouping**: Related features together
✅ **Scalable**: Easy to add new import methods or library features
✅ **Modern Pattern**: Matches Notion, Linear, Vercel dashboards

## Implementation Notes

1. Keep existing functionality - zero breaking changes
2. Add sub-tab navigation component
3. Refactor content into focused screens
4. Maintain all ARIA roles and accessibility
5. Add smooth transitions between sub-tabs
