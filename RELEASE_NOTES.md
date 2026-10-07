# Resume Craft v2.4.1

## Highlights

- Sanitizes all built-in demo contact identities so template examples use explicit placeholders instead of realistic-looking GitHub, LinkedIn, email, WeChat, or phone identities.
- Uses `example.com` email addresses and clearly synthetic / reserved-style phone examples in the built-in templates.
- Avoids angle-bracket placeholders that Markdown could interpret as HTML and hide from rendered output.
- Adds regression coverage to prevent realistic third-party contact identities from being reintroduced.
- Verifies the US demo contact line parses cleanly without orphan punctuation or separators.
- Keeps the existing language contract unchanged: UI language and resume content language remain independent.

## Language behavior

- The top `中 / EN` control changes the application interface only.
- `Layout → Resume language` controls standard resume content headings such as `Summary`, `Skills`, `Work Experience`, `Projects`, and `Education`.
- This allows a Chinese interface to edit an English resume, or an English interface to edit a Chinese resume, without mutating resume content unintentionally.

## Release status

v2.4.1 is a patch release on top of v2.4.0. It brings the already-deployed template contact sanitization into the packaged GitHub Release artifacts so the live site and downloadable release stay aligned.

Release: https://github.com/kunlong-luo/resume-craft/releases/tag/v2.4.1
