"""Derive a quantized lead from the supplied reference, without retaining samples.

Usage: python scripts/analyse-anthem.py decoded-mono.wav
Prints note/start/duration tuples for musical review. Requires numpy/scipy.
"""
import json
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
from scipy.ndimage import median_filter, maximum_filter1d

sr, y = wavfile.read(sys.argv[1])
y = y.astype(float) / max(1, np.max(np.abs(y.astype(float))))
hop = round(sr * .0125)
freq, times, spectrum = stft(y, sr, nperseg=4096, noverlap=4096-hop, nfft=16384)
mag = abs(spectrum)
# Local spectral whitening makes the fundamental less dependent on microphone EQ.
floor = median_filter(mag, size=(61, 1)) + .000015
peaks = maximum_filter1d(np.log1p(mag / floor), size=5, axis=0)
notes = np.arange(48, 73)
salience = np.zeros((len(notes), len(times)))
for row, note in enumerate(notes):
    fundamental = 440 * 2 ** ((note-69)/12)
    for harmonic in range(1, 7):
        k = np.argmin(abs(freq-fundamental*harmonic))
        band=(freq>fundamental*harmonic*.975)&(freq<fundamental*harmonic*1.025)
        salience[row] += np.sqrt(mag[band].max(axis=0)) / harmonic ** .5
    # Penalize candidates whose fundamental is absent.
    k = np.argmin(abs(freq-fundamental))
    salience[row] += np.sqrt(mag[k]) * .5
salience = median_filter(salience, size=(1, 5))
salience /= np.maximum(.1, salience.std(axis=0))
transition = np.minimum(abs(notes[:, None]-notes[None, :])*1.1, 8)
cost = salience[:, 0].copy()
back = []
for frame in range(1, len(times)):
    candidates = cost[:, None] - transition
    parent = candidates.argmax(axis=0)
    back.append(parent)
    cost = candidates[parent, np.arange(len(notes))] + salience[:, frame]
track = [int(cost.argmax())]
for parent in reversed(back):
    track.append(int(parent[track[-1]]))
track = notes[np.array(track[::-1])]
track = median_filter(track, size=7)
segments = []
start = 0
for i in range(1, len(track)+1):
    if i == len(track) or track[i] != track[start]:
        duration = (i-start)*hop/sr
        if duration >= .075:
            segments.append([int(track[start]), round(start*hop/sr, 3), round(duration, 3)])
        start = i
print(json.dumps(segments))
