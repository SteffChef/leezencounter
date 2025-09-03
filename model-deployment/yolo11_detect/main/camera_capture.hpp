
#ifndef CAMERA_CAPTURE_HPP
#define CAMERA_CAPTURE_HPP

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_camera.h"

void setupCamera();
void recalibrateCamera();


#endif // CAMERA_CAPTURE_HPP