# Offline face anti-spoofing model

The face verification modal uses **MiniFASNet-V2** (minivision-ai /
Silent-Face-Anti-Spoofing, **Apache-2.0**) to reject photos and replayed videos —
fully offline in the browser, free, no cloud, no per-check cost, no lock-in.

## Files (already committed)

```
public/models/antispoof/minifasnet_v2.onnx   # the model (1x3x80x80, NCHW, BGR, /255)
public/ort/ort-wasm-simd-threaded.wasm        # onnxruntime-web runtime (self-hosted)
public/ort/ort-wasm-simd-threaded.mjs
```

The model is loaded by `utils/antiSpoof.ts` via `onnxruntime-web` (a dependency in
`package.json` — run `npm install` after pulling). Output is a 3-class softmax
`[live, print-attack, replay-attack]`; the live probability is `out[0]`.

## Provenance

- Source: https://huggingface.co/garciafido/minifasnet-v2-anti-spoofing-onnx
- SHA-256: `d7b3cd9ba8a7ceb13baa8c4720902e27ca3112eff52f926c08804af6b6eecc7b`
- License: Apache-2.0 (attribution: minivision-ai / Beijing Mininglamp Vision).

## Calibrate, then enforce (in `components/FaceVerificationModal.tsx`)

1. `npm install` (pulls onnxruntime-web), reload, open Face Verification.
2. Watch the console: `[antispoof] liveProb=0.xxx`. Note the value for a **live
   face** (should be high, near 1) and for a **phone video / photo** (should be
   low, near 0).
3. Send those numbers — we set `ANTISPOOF_THRESHOLD` between them and flip
   `ANTISPOOF_ENFORCE = true`.
4. If `liveProb` looks inverted or stuck, the crop/preprocessing may need a tweak
   in `utils/antiSpoof.ts` (`ANTISPOOF_CROP_SCALE`, channel order, or the output
   index) — tell me the numbers and I'll adjust.

> Runs from files you host — no vendor can disable it or bill you later.
