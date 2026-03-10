# AGENTS.md

## Design Context

### Users
- This is a back-office product for Devcombine's internal operations.
- Primary users are admins managing staffing, compensation, project assignments, and engineer records.
- Secondary users are engineers updating their profile, availability, and assigned work with minimal friction.
- The core job to be done is maintaining accurate operational data and moving through staffing workflows with speed, clarity, and low cognitive load.

### Brand Personality
- Pragmatic, Elite, Disruptive.
- The interface should evoke calm control.
- Voice and tone should feel direct, composed, competent, and efficient rather than chatty or playful.

### Aesthetic Direction
- Treat the product as an operational control surface, not a marketing site.
- Light mode only.
- Favor restrained, high-signal interfaces with strong hierarchy and clear workflow affordances.
- Reference qualities:
  - Notion: calm and controlled presentation.
  - Datadog: operational density and confident utility.
  - Jira: structured workflow orientation.
- Anti-reference:
  - Slack. Avoid casual, social, chat-like, or overly friendly visual patterns.
- Existing implementation cues worth preserving unless there is a strong reason to change them:
  - `Space Grotesk` typography
  - soft blue-gray gradients
  - rounded surfaces
  - restrained MUI-based component styling

### Design Principles
1. Design for calm control.
Keep layouts orderly, readable, and composed. Every screen should feel operationally stable under load.

2. Optimize for back-office throughput.
Prioritize scanability, filtering, editability, and quick decision-making over decorative storytelling.

3. Signal elite competence.
Use precise typography, disciplined spacing, and intentional emphasis. Avoid anything that feels generic, sloppy, or consumer-app casual.

4. Be disruptive through sharpness, not noise.
The product can feel modern and differentiated, but not loud. Distinction should come from clarity, structure, and confidence.

5. Preserve a light, professional system.
Do not introduce dark mode or playful color behavior by default. Keep the palette restrained and the visual language consistent across admin and engineer workflows.
