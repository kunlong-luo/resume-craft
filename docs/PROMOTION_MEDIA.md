# Resume Craft — real promotional media capture

This is a repeatable Playwright browser capture of the **real Resume Craft UI**, seeded only with fictional sample Markdown. It does not use AI-generated fake screenshots, personal resume files, a paid account, or visitor analytics.

## Downloadable files

The GitHub Actions workflow **Capture Real Promotion Media** uploads a `resume-craft-promotion-media` ZIP artifact (30-day retention) containing:

- `resume-craft-product-screenshot.png`: real desktop app in split editing / preview layout.
- `resume-craft-markdown-preview.png`: genuine source editor after typing a new resume bullet.
- `resume-craft-download-options.png`: real app with export options (or the unchanged app if the menu is unavailable).
- `resume-craft-demo.webm`: raw browser screen recording.
- `resume-craft-demo.mp4`: **polished 1280×720 promotional cut** combining a branded intro, real Chromium browser recording with editorial chapter captions, and a short call-to-action outro.
- `resume-craft-social-cover.png`: designed 1200×630 social cover generated from `public/og-card.svg` during the build; **an illustration, not a screenshot**.
- `resume-craft-reddit-cover-1280x720.png`: polished 16:9 thumbnail incorporating the **real** screenshot.
- `resume-craft-product-gallery-1200x900.png`: product-gallery card around the real UI.
- `resume-craft-social-1080x1350.png`: portrait social tile around the real UI.
- `resume-craft-video-outro-1280x720.png`: brand call-to-action slide.

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

This recording demonstrates real form/Markdown editing, live preview, one-click page fitting, and the **export menu**; it does **not** prove that an actual PDF was created. Do not title it “PDF successfully exported” unless an actual export step is captured and verified. The fictional resume belongs to an example user only.

If the workflow fails, inspect its logs and fix the named selector or capture step rather than substituting a fabricated UI.

## V2 design decisions

- The real height guard is collapsed using the application's existing local preference (not removed from the UI image).
- The scene edits the summary at the top of the resume so the change is visible within the frame. No synthetic transitions are applied inside the application screenshot.
- Editorial captions are superimposed during browser capture and clearly distinguish the product demo chapters from the product UI. Clean PNGs do not contain the added captions.
- Promotional frames are generated with `scripts/render-promotion-assets.mjs` and include an unaltered, aspect-fitted Chromium screenshot, rather than AI-generated form controls or invented UI.
- The final MP4 adds a concise intro and outro in post-production. Chapter overlay and screen recording show actual application interactions.
- The export-menu action is verified before the frame is captured. Showing the export menu is **not** a claim that a PDF was successfully saved.
