# Focused recorder pose assets

These 20 PNG files are display-focused derivatives of the aligned source
images in `../poses/`. The source images remain unchanged at `976x1360`.

Across all source images, the union of pixels that differ from pure white is
`(144, 146)-(835, 1198)`. Adding a 16-pixel safety margin produces the shared
crop `(128, 130)-(851, 1214)`, so every focused image is `723x1084` and keeps
the same recorder and hand alignment.

Validation pastes every focused image back onto a white `976x1360` canvas at
`(128, 130)` and requires a pixel-perfect match with its source image.
