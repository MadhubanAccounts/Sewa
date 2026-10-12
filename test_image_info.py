import struct

with open('image.png', 'rb') as f:
    data = f.read(24)
    w, h = struct.unpack('>LL', data[16:24])
    print(f"Image dimensions: {w}x{h}")
