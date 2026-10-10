# Resume Craft — real promotional media capture

This is a repeatable Playwright browser capture of the **real Resume Craft UI**, seeded only with fictional sample Markdown. It does not use AI-generated fake screenshots, personal resume files, a paid account, or visitor analytics.

## Downloadable files

The GitHub Actions workflow **Capture Real Promotion Media** uploads a `resume-craft-promotion-media` ZIP artifact (30-day retention) containing:

- `resume-craft-product-screenshot.png`: real desktop app in split editing / preview layout.
- `resume-craft-markdown-preview.png`: genuine source editor after typing a new resume bullet.
- `resume-craft-download-options.png`: real app with export options (or the unchanged app if the menu is unavailable).
- `resume-craft-demo.webm`: raw browser screen recording.
- `resume-craft-demo.mp4`: MP4 version for communities that support direct video uploads.
- `resume-craft-social-cover.png`: designed 1200×630 social cover generated from `public/og-card.svg` during the build; **an illustration, not a screenshot**.

## Regenerate

1. Open **Actions → Capture Real Promotion Media → Run workflow** after this workflow is on `main`, or push the feature branch configured in the workflow.
2. Wait for capture, then open the run summary.
3. Under **Artifacts**, download `resume-craft-promotion-media`.
4. Review the generated PNGs and MP4 **before** posting: cropping, fonts, clear sample data, export menu visibility, and accurate UX after code changes.

The workflow runs a temporary local Vite server inside GitHub Actions. It does not save or read personal resumes and does not contact the public analytics origin.

## Community use

- Reddit: upload `resume-craft-demo.mp4` natively if allowed; put the live demo link and feedback question in the post.
- GitHub README / technical articles: use `resume-craft-product-screenshot.png` and an annotated caption identifying it as a screenshot.
- Product Hunt: review the current launch requirements and use the real screenshot plus a video.
- Social link previews: the application already publishes an OG cover; use `resume-craft-social-cover.png` as a matching standalone graphic when useful.

## Honest claims

This recording demonstrates editing, live preview, layout controls, and the **export menu**; it does **not** prove that an actual PDF was created. Do not title it “PDF successfully exported” unless an actual export step is captured and verified. The fictional resume belongs to an example user only.

If the workflow fails, inspect its logs and fix the named selector or capture step rather than substituting a fabricated UI.
