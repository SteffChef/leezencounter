import cv2
import os
import numpy as np

video_path = "yourdirectorypath"

output_dir = "extracted_framesbutyoucanchangethisname"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Cannot open video file.")
    exit()


fps = int(cap.get(cv2.CAP_PROP_FPS))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

#if you want to capture between 6:14 -6:20 you should tell 6 * 60 + 34 , 6*60+20 basically minute * 60 + seconds
time_ranges = [
    (8 * 60 + 34, 9 * 60),         # 8:34 to 9:00
    (14 * 60 + 34, 15 * 60),       # 14:34 to 15:00
    (25 * 60 + 34, 26 * 60),       # 25:34 to 26:00
    (48 * 60 + 34, 49 * 60),       # 48:34 to 49:00
    (51 * 60 + 34, 52 * 60),       # 51:34 to 52:00
]

frames_per_range = 25

for i, (start_time, end_time) in enumerate(time_ranges):
    start_frame = int(start_time * fps)
    end_frame = int(end_time * fps)

    frame_indices = np.linspace(start_frame, end_frame, frames_per_range, dtype=int)

    for j, frame_idx in enumerate(frame_indices):
        if frame_idx >= total_frames:
            print(f"Frame {frame_idx} exceeds total frame count. Skipping.")
            continue

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()

        if not ret:
            print(f"Error reading frame {frame_idx}. Skipping.")
            continue

        #you can give it a differnt name
        frame_filename = os.path.join(output_dir, f"{i+1}_{start_time}_frame{j+1:02d}.jpg")
        cv2.imwrite(frame_filename, frame)
        print(f"Saved: {frame_filename}")


cap.release()
print("Finished extracting frames.")