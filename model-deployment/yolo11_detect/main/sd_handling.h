#ifndef SD_HANDLING_H
#define SD_HANDLING_H

#include "esp_err.h"
#include "esp_log.h"
#include "driver/sdmmc_types.h"
#include "dl_image.hpp"
#include "dl_detect_base.hpp"
#include <list>
#include "esp_camera.h" 

#ifdef __cplusplus
extern "C" {
#endif

esp_err_t init_sd_card();
bool is_sd_card_mounted();
esp_err_t save_jpeg(const camera_fb_t *fb, const char *filename);
esp_err_t save_detection_results(const std::list<dl::detect::result_t> &results, float confidence_threshold, const char *filename);
int get_image_counter();
int increment_image_counter();

#ifdef __cplusplus
}
#endif

#endif // SD_HANDLING_H
