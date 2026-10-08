export const FAQ = [
  [
    "What is The Vintage Photobooth?",
    "A browser photobooth for making vintage-inspired photo strips from a camera or existing images. You capture a sequence, customize a frame, watch a short printing animation and save the finished strip."
  ],
  [
    "Is it free, and do I need an account?",
    "You do not need an account. Download Photo saves a high-resolution PNG for free. GIF, Live Strip, Full Live Moment and QR sharing use a shared session reward unlock; the live rewarded provider is not connected yet, so those enhanced actions are unavailable on the public site."
  ],
  [
    "Does it work on mobile?",
    "The interface adapts to phone-sized screens, but camera selection, recording formats and export performance vary by device and browser. A current browser, sufficient free memory and HTTPS are important. We do not guarantee motion support on every phone."
  ],
  [
    "Why does it need camera access?",
    "Camera access provides the live preview, still frames and local motion recording. You can choose Upload instead if you do not want to enable a camera. Reading existing image files does not require camera permission."
  ],
  [
    "Is microphone permission required?",
    "No. Live Moment Audio is optional and separate from Capture Sound. If microphone access is denied or unavailable, photos and silent motion can still work. Capture Sound plays the countdown and shutter cues; it does not record you."
  ],
  [
    "Are my photos uploaded?",
    "Normal captures, chosen image files and generated outputs stay in the browser. The explicit Create QR action, when available, uploads only the finished still PNG. Raw photographs, GIFs, motion clips and microphone recordings are not uploaded by that feature."
  ],
  [
    "Where are filters and videos processed?",
    "On your device, using browser canvas, workers and media APIs. Camera and microphone permissions can be revoked in browser settings. A slow or memory-constrained device may take longer to render, especially with larger strips and motion."
  ],
  [
    "Which photo counts and timers are available?",
    "Choose 1, 2, 4, 5, 6, 8, 10 or 12 photos. Timers are 1, 3, 5 or 10 seconds. The 1-second setting takes one photo per manual Capture press. The other timers continue through the photo count, with Smile! as the final pose cue."
  ],
  [
    "How does the screen flash work?",
    "When enabled, each camera shutter briefly fills the viewport with pure white. The still is read from the camera video after a short illumination delay. A gentle digital brightening effect is applied to the photo before its selected filter, keeping the original capture intact. Turn Flash off if you do not want these effects. It cannot raise your device’s physical display brightness."
  ],
  [
    "What is a Live Moment? Does it include the countdown?",
    "A Live Moment is the recorded lead-up to a camera photograph, including the countdown and final Smile! pose. Capture records continuously across an automatic run and associates each photo with its part of that source. Uploaded photographs have no recorded motion."
  ],
  [
    "What is Live Strip?",
    "Live Strip plays available camera moments within the customized strip, preserving saved photo filters, frame geometry and decorations. Slots without motion remain still. Its preview is muted; optional audio in exports depends on the source and browser support."
  ],
  [
    "What is Full Live Moment, and how long is it?",
    "It is the continuous camera recording from a capture run, without the decorated-strip layout. Its length follows the actual run, including countdowns, rather than being cut to a fixed few seconds. It needs a single shared recording source; disconnected camera runs are not stitched together."
  ],
  [
    "Why is Full Live Moment unavailable?",
    "The browser may not support recording or the required export format, the recording may have reached a resource limit, or camera photos may come from different recording sources after an interruption. You can still save the still strip; available per-photo motion may still be usable."
  ],
  [
    "Can I upload photos?",
    "Yes. Choose Upload on Capture and select image files. Common JPEG, PNG and WebP files are supported where the browser can decode them; other formats, particularly HEIC/HEIF, depend on browser support. Files are read locally and fill available photo slots."
  ],
  [
    "Which filters are available?",
    "Original, Classic, Chrome, Velvet, Emerald, Golden Hour, Flash 2000, Disposable, Night Flash and Mono. These are original digital looks, not official camera-brand simulations. A captured photo keeps the look chosen when its shutter fired."
  ],
  [
    "Can I customize frames?",
    "Yes. Choose a generated frame for any supported photo count, or an illustrated custom template for four photos. Change the backing color; photos fit their windows automatically. Positioning controls apply to stickers and text. The template’s original artwork remains part of the strip."
  ],
  [
    "Can I add stickers and text?",
    "Yes. Add supplied stickers or your own caption text, then move, resize, rotate and layer the elements. Use undo and redo while experimenting. Editing causes generated outputs to be refreshed on the next export."
  ],
  [
    "How does Print work?",
    "Print starts the short on-screen photobooth printing animation. When it finishes, choose See Your Photos. It never calls browser printing or opens a system print dialog."
  ],
  [
    "How does QR sharing work?",
    "When the reward-backed feature is available, Create QR validates and uploads only the final PNG to private temporary storage. A random link lets recipients open and download it. Shareable PNGs have a 4 MB limit; larger PNGs remain available through the free local download."
  ],
  [
    "How long is a QR link available?",
    "Exactly ten minutes from publication, measured by the server. It is meant for a quick handoff, not permanent storage. A new share gets a new link and its own ten-minute lifetime; it does not renew an expired link."
  ],
  [
    "What happens after expiration?",
    "New image requests are denied even if scheduled deletion has not yet removed the stored object. The page hides the expired strip. A copy a recipient already saved is outside that expiry control and cannot be recalled."
  ],
  [
    "Why is my camera not working?",
    "Check the browser’s camera permission, use HTTPS, close other apps that may hold the camera, and choose another available device. If hardware or permissions still prevent access, use Upload. Microphone permission is not required to take stills."
  ],
  [
    "How do I retake photos?",
    "Restart on Capture clears the current sequence and lets you begin again. Pause stops an automatic sequence so you can resume when ready. Save any output you want to keep before starting a completely new session."
  ],
  [
    "What does Edit Again do?",
    "It returns from Results to Customize with your current captures and decorations. The next generated output uses the edited composition. Your current session’s completed reward unlock, when available, survives editing."
  ],
  [
    "What does Take Another do?",
    "It starts a new session with fresh settings and media. Previous in-memory captures and generated outputs are released, and the session reward unlock resets. Download anything you want to keep before using it."
  ],
  [
    "Can you recover my photos if I refresh?",
    "No. Normal media is held in browser memory rather than stored in an account or permanent server gallery. Refreshing, closing the tab or leaving through a fresh document can discard it. Save the finished PNG before leaving."
  ],
  [
    "Who can I contact?",
    "Email the.vintage.pb@gmail.com for questions about The Vintage Photobooth. Do not include private photographs, recordings or credentials unless they are necessary for a request you deliberately choose to make."
  ]
] as const;
