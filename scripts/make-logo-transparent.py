#!/usr/bin/env python3
"""Make logo-orbtap.png background transparent (remove black around logo)."""
from PIL import Image
import numpy as np

import os
path = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "logo-orbtap.png")
img = Image.open(path).convert("RGBA")
arr = np.array(img)
# Make near-black pixels transparent (background)
r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
dark = (r < 30) & (g < 30) & (b < 30)
arr[dark, 3] = 0
Image.fromarray(arr).save(path)
print("Done: made dark background transparent")
