; Simple square toolpath
G21 ; Set units to millimeters
G90 ; Absolute positioning
G0 Z5 ; Move up for safety
G0 X0 Y0 ; Move to start position
G1 Z-1 F100 ; Plunge to cutting depth
G1 X50 F200 ; Cut along X
G1 Y50 ; Cut along Y
G1 X0 ; Cut back along X
G1 Y0 ; Cut back along Y
G0 Z5 ; Move up for safety
M2 ; End program 