# Offline face anti-spoofing model

The face verification modal will use a TensorFlow.js liveness model placed **here**
to reject photos and replayed videos — fully offline, free, no cloud, no per-check
cost. Until a model is present, the model gate is **skipped** (the app still works).

## What to put here

A TensorFlow.js model:

```
public/models/antispoof/
  model.json
  group1-shard1of1.bin   (one or more weight shard .bin files)
```

The code loads `/models/antispoof/model.json` (tries `loadGraphModel`, then
`loadLayersModel`).

## Recommended model (Apache-2.0, free for commercial use)

**Silent-Face-Anti-Spoofing / MiniFASNet** by MiniVision — https://github.com/minivision-ai/Silent-Face-Anti-Spoofing
(license: Apache-2.0). The default preprocessing in `utils/antiSpoof.ts`
(`ANTISPOOF_INPUT=80`, `ANTISPOOF_CROP_SCALE=2.7`, `ANTISPOOF_LIVE_INDEX=1`)
matches its `2.7_80x80_MiniFASNetV2` model.

### Convert it to TensorFlow.js (one-time, on any dev machine with Python)

```bash
pip install onnx onnx-tf tensorflowjs

# 1) Get/convert the MiniFASNet weights to ONNX (the repo provides .pth; export to .onnx),
#    or use an existing 2.7_80x80_MiniFASNetV2.onnx.
# 2) ONNX -> TensorFlow SavedModel
onnx-tf convert -i 2.7_80x80_MiniFASNetV2.onnx -o saved_model
# 3) SavedModel -> TensorFlow.js GraphModel
tensorflowjs_converter --input_format=tf_saved_model saved_model ./tfjs_model
```

Copy everything from `./tfjs_model/` into this folder.

## After adding the model — validate, then enforce

1. Pull, reload, open Face Verification. The console logs:
   `[antispoof] liveProb=0.xxx (threshold 0.5, enforce=false)`
2. Note the value for a **live face** (should be high, near 1) and for a **phone
   video / photo** (should be low, near 0).
3. Send those numbers — we set `ANTISPOOF_THRESHOLD` between them and flip
   `ANTISPOOF_ENFORCE = true` in `components/FaceVerificationModal.tsx`.
4. If the model expects different preprocessing (its `liveProb` looks inverted or
   stuck), we adjust `ANTISPOOF_INPUT` / `ANTISPOOF_CROP_SCALE` /
   `ANTISPOOF_LIVE_INDEX` in `utils/antiSpoof.ts`.

> Note: this runs from files you host — no vendor can disable it or bill you later.
