# MineCraft

The beginnings of a Minecraft clone that runs **inside the Bilibili video player** — a from-scratch 3D software renderer written for Bilibili's advanced-danmaku (高级弹幕) scripting sandbox, the same Flash-era environment as my [danmuku_game](https://github.com/qq456cvb/danmuku_game). Paste `MineCraft.js` into the "高级弹幕" editor and you get a textured terrain block you can walk around with WASD/arrow keys and look around with the mouse.

## What's Implemented

The sandbox exposes no 3D API, so the whole pipeline is hand-rolled in `MineCraft.js`:

- **Math**: look-at view matrix and a perspective projection matrix built from scratch on the sandbox's `Matrix3D`/`Vector3D` primitives, with full model → view → projection → NDC → screen vertex transformation.
- **Rasterization**: triangles are drawn with Flash's `drawTriangles`, passing per-vertex `1/w` so texture mapping is perspective-correct. Visibility is handled by a painter's algorithm — a quicksort over the per-frame triangle list by depth — plus near/far rejection in NDC.
- **Texturing**: the grass texture is a BMP embedded as a base64 string, decoded by a hand-written loader (`DEBitmapLoader`) that parses the BMP header and converts ABGR to RGBA.
- **Input**: mouse-move drives the view direction; WASD/arrows translate the eye along the view and strafe axes at 30 fps.

## Status

Engine groundwork only — the scene is a single textured quad, and the planned block-placement API and collision detection were never added. Bilibili has since retired the Flash danmaku engine entirely, so running it today requires a BiliScript-compatible emulator. (A period note: after a Bilibili player update, `//` line comments broke the script and had to be replaced with `/* */` block comments.)
