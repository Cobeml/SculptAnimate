; Square toolpath on a 200x200 grid
G21 ; Set units to millimeters
G90 ; Absolute positioning
G0 Z10 ; Move up for safety
G0 X-60 Y-60 ; Move to start position (larger square)
G1 Z0 F300 ; Plunge to cutting depth (top surface of block)
G1 X60 F600 ; Cut along X
G1 Y60 ; Cut along Y
G1 X-60 ; Cut back along X
G1 Y-60 ; Cut back along Y
G0 Z10 ; Move up for safety
M2 ; End program 