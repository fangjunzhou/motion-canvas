---
'@canvas-commons/core': patch
---

Remove claimed asynchronous resources from the pending queue before awaiting
them, preventing false unyielded-resource errors when editor and presentation
playback overlap. Preserve resources collected while the current batch loads.
