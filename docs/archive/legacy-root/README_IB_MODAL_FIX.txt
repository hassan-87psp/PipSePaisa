PipSePaisa IB Modal Fully Fixed

Root cause fixed:
- A malformed script string in index.html prematurely closed the main JavaScript block.
- This caused JavaScript source code to appear as visible text inside/behind the IB modal.

Also included:
- Safe IB modal renderer
- Old DPrime and XM broker cards retained
- New Exness cards retained
- New cache version to prevent browsers loading the old broken JS

Upload the complete ZIP contents and replace existing files.
Then clear hosting/CDN cache and hard refresh.
