# Sketches

This sub-repository contains all MCU scripts in form of arduino sketches that were used throughout this project.

## Sub-Repository Structure

```text
├── camera_capture                  # initial attempt for photo capturing using ESP32-S3's on-device camera
├── camera_capture_v2_bydatetime    # improved version of camera_capture, but with datetime as file names for storing images on SD cards
├── camera_capture_w_calibration    # final version of camera_capture incorporating camera re-calibration logic
├── camera_server                   # auxiliary sketch for streaming camera views to a dedicated URL
└── lorawan_send                    # production sketch used for LoRaWAN data transmission
```

[camera_capture](./camera_capture/) has some flaws as it was out initial attempt for capturing images through the on-device camera of the ESP32-S3. Collected images are stored on a micro SD card. Image file names receive a number starting at one. Everytime the sketch gets re-ran, the existing files on the SD card get overwritten.

[camera_capture_v2_bydatetime](./camera_capture_v2_bydatetime/) improves this a bit by setting the image file names to the datetime the image was captured.

[camera_capture_w_calibration](./camera_capture_w_calibration/) is the final version. It assigned image file names to unique interger numbers, starting at the next biggest number that does not exist on the SD card. Further, it incorporates an camera re-calibration logic that prevented consistent image capturing in varying illumination settings. More information about this can be found in the documentation (see this repo's wiki).

[camera_server](./camera_server/) is an auxiliary sketch that allows streaming the camera output to a dedicated local webserver. This might be useful to test whether the mounted MCU captures a good point of view of the scene.

[lorawan_send](./lorawan_send/) includes the data transmission logic. This sketch runs on a second MCU and includes the BLE client. The BLE client receives the model predictions from the BLE server and forwards them via LoRaWAN to TTN. Secrets for TTN nodes have to be changed as well as the BLE server-client credentials.


## SD Card Formatting

> [!NOTE]  
> Before inserting a micro SD card into dedicated ESP32-S3 card slot, the SD card has to exhibit the FAT32 file system format. Otherwise, writing data to the SD card will fail. Have a look at the [official documentation](https://wiki.seeedstudio.com/xiao_esp32s3_sense_filesystem/#prepare-the-microsd-card) how to do this.

For macOS users, [this official SD card formatting software](https://www.sdcard.org/downloads/formatter/sd-memory-card-formatter-for-mac-download/) was used. Windows and Linux users may refer to the [XIAO documentation on how to perpare the micro SD card](https://wiki.seeedstudio.com/xiao_esp32s3_sense_filesystem/#prepare-the-microsd-card).
