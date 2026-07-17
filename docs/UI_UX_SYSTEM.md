# TeamReady UI/UX System

## Product direction

TeamReady uses a premium, calm sports-performance visual language. The interface should feel trustworthy enough for wellness data, fast enough for daily use, and attractive enough to present to clubs and academies.

## Design principles

1. Clarity before decoration.
2. One primary action per screen.
3. Mobile-first player flows.
4. Desktop-first coach analysis.
5. Colour communicates readiness but never acts as the only signal.
6. Motion supports orientation and must respect reduced-motion preferences.

## Visual system

- Deep navy navigation shell
- Teal-to-blue brand gradient
- Frosted white dashboard surfaces
- Large rounded cards with quiet depth
- Compact status pills
- Strong numeric hierarchy for readiness metrics
- Soft background gradients rather than flat grey

## Status colours

- Ready: green
- Monitor: amber
- Review: red
- Missing: neutral grey

Every status must also include readable text.

## Core screens

### Organisation owner
- Signup
- Organisation details
- Team creation
- Staff invitations
- Permissions

### Coach
- Team dashboard
- Player heatmap
- Alerts
- Check-in completion
- Team trends
- Individual player view
- Notes and decisions

### Player
- Invitation acceptance
- Account setup
- Consent
- Daily check-in
- Submission confirmation
- Personal trends

## Responsive behaviour

- Below 1000px, the persistent sidebar becomes a stacked header/navigation area.
- Below 680px, all forms and dashboard grids collapse to one column.
- Player heatmaps remain two columns on small mobile screens.
- Rating controls wrap from ten columns to five columns.

## Accessibility

- Maintain visible focus rings.
- Do not rely on colour alone.
- Minimum 44px practical touch targets for production mobile flows.
- Respect `prefers-reduced-motion`.
- Medical and wellness notes must show permission context.

## Framer translation notes

The same system can be recreated in Framer using components for Card, Button, Input, Status Pill, Metric Card, Player Tile, Navigation Item, Alert Row, and Mobile Shell. Variants should cover default, hover, active, disabled, success, warning, and danger states.
