// BleClient.cpp

#include "BleClient.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_bt.h"
#include "esp_bt_main.h"
#include "esp_gatt_common_api.h"
#include <cstring>

#define GATTC_TAG "BLE_CLIENT_CPP"
#define PROFILE_APP_ID 0
#define INVALID_HANDLE 0
#define TARGET_DEVICE_NAME "ESP32_BLE_Server"

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define PROFILE_NUM      1
#define PROFILE_A_APP_ID 0
#define INVALID_HANDLE   0
#if CONFIG_EXAMPLE_INIT_DEINIT_LOOP
#define EXAMPLE_TEST_COUNT 50
#endif

// Define the service and characteristic UUIDs
// Note: UUIDs are defined in reverse byte order in the C struct.
static esp_bt_uuid_t remote_filter_service_uuid = {
    .len = ESP_UUID_LEN_128,
    .uuid = {.uuid128 = {0x4b, 0x91, 0x31, 0xc3, 0xc9, 0xc5, 0xcc, 0x8f,
                          0x9e, 0x45, 0xb5, 0x1f, 0x01, 0xc2, 0xaf, 0x4f}},
};

static esp_bt_uuid_t remote_filter_char_uuid = {
    .len = ESP_UUID_LEN_128,
    .uuid = {.uuid128 = {0xa8, 0x26, 0x1b, 0x36, 0x07, 0xea, 0xf5, 0xb7,
                          0x88, 0x46, 0xe1, 0x36, 0x3e, 0x48, 0xb5, 0xbe}},
};

static esp_bt_uuid_t notify_descr_uuid = {
    .len = ESP_UUID_LEN_16,
    .uuid = {.uuid16 = ESP_GATT_UUID_CHAR_CLIENT_CONFIG},
};

// Initialize the static instance pointer
BleClient* BleClient::s_instance = nullptr;

BleClient::BleClient() : m_is_connected(false), m_is_server_found(false) {
    s_instance = this; // Set the static instance to this object
    memset(&m_profile, 0, sizeof(m_profile));
    m_profile.app_id = PROFILE_APP_ID;
    m_profile.gattc_if = ESP_GATT_IF_NONE;
}

bool BleClient::is_connected() {
    return m_is_connected;
}

void BleClient::connect_to_server() {
    ESP_LOGI(GATTC_TAG, "Starting BLE Client initialization...");

    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    ESP_ERROR_CHECK(esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT));

    esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
    ret = esp_bt_controller_init(&bt_cfg);
    if (ret) {
        ESP_LOGE(GATTC_TAG, "Initialize controller failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bt_controller_enable(ESP_BT_MODE_BLE);
    if (ret) {
        ESP_LOGE(GATTC_TAG, "Enable controller failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bluedroid_init();
    if (ret) {
        ESP_LOGE(GATTC_TAG, "Init bluedroid failed: %s", esp_err_to_name(ret));
        return;
    }

    ret = esp_bluedroid_enable();
    if (ret) {
        ESP_LOGE(GATTC_TAG, "Enable bluedroid failed: %s", esp_err_to_name(ret));
        return;
    }

    // Register GAP and GATTC callbacks
    ret = esp_ble_gap_register_callback(static_gap_event_handler);
    if (ret) {
        ESP_LOGE(GATTC_TAG, "GAP register failed, error code = %x", ret);
        return;
    }

    ret = esp_ble_gattc_register_callback(static_gattc_event_handler);
    if (ret) {
        ESP_LOGE(GATTC_TAG, "GATTC register failed, error code = %x", ret);
        return;
    }

    ret = esp_ble_gattc_app_register(PROFILE_APP_ID);
    if (ret) {
        ESP_LOGE(GATTC_TAG, "GATTC app register failed, error code = %x", ret);
    }
    
    esp_err_t local_mtu_ret = esp_ble_gatt_set_local_mtu(200);
    if (local_mtu_ret) {
        ESP_LOGE(GATTC_TAG, "Set local MTU failed, error code = %x", local_mtu_ret);
    }
}

void BleClient::send_data(const std::string& data) {
    if (!m_is_connected || m_profile.char_handle == INVALID_HANDLE) {
        ESP_LOGE(GATTC_TAG, "Not connected or characteristic not found. Cannot send data.");
        return;
    }

    esp_err_t err = esp_ble_gattc_write_char(
        m_profile.gattc_if,
        m_profile.conn_id,
        m_profile.char_handle,
        data.length(),
        (uint8_t*)data.c_str(),
        ESP_GATT_WRITE_TYPE_RSP, // Use with response for reliability
        ESP_GATT_AUTH_REQ_NONE);

    if (err != ESP_OK) {
        ESP_LOGE(GATTC_TAG, "Write characteristic failed: %s", esp_err_to_name(err));
    }
}


// --- Static callback wrappers ---
void BleClient::static_gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    if (s_instance) {
        s_instance->gap_event_handler(event, param);
    }
}

void BleClient::static_gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param) {
    if (s_instance) {
        s_instance->gattc_event_handler(event, gattc_if, param);
    }
}


// --- Member function implementations for events ---

void BleClient::gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param) {
    if (event == ESP_GATTC_REG_EVT) {
        if (param->reg.status == ESP_GATT_OK) {
            m_profile.gattc_if = gattc_if;
        } else {
            ESP_LOGE(GATTC_TAG, "Reg app failed, app_id %04x, status %d", param->reg.app_id, param->reg.status);
            return;
        }
    }

    if (gattc_if == ESP_GATT_IF_NONE || gattc_if == m_profile.gattc_if) {
        gattc_profile_event_handler(event, gattc_if, param);
    }
}

void BleClient::gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    switch (event) {
        case ESP_GAP_BLE_SCAN_PARAM_SET_COMPLETE_EVT: {
            uint32_t duration = 30; // Scan for 30 seconds
            esp_ble_gap_start_scanning(duration);
            break;
        }
        case ESP_GAP_BLE_SCAN_START_COMPLETE_EVT:
            if (param->scan_start_cmpl.status != ESP_BT_STATUS_SUCCESS) {
                ESP_LOGE(GATTC_TAG, "Scan start failed, status %x", param->scan_start_cmpl.status);
            } else {
                ESP_LOGI(GATTC_TAG, "Scan start success. Looking for '%s'", TARGET_DEVICE_NAME);
            }
            break;
        case ESP_GAP_BLE_SCAN_RESULT_EVT: {
            esp_ble_gap_cb_param_t *scan_result = param;
            if (scan_result->scan_rst.search_evt == ESP_GAP_SEARCH_INQ_RES_EVT) {
                uint8_t *adv_name = NULL;
                uint8_t adv_name_len = 0;
                adv_name = esp_ble_resolve_adv_data_by_type(scan_result->scan_rst.ble_adv,
                                                           scan_result->scan_rst.adv_data_len + scan_result->scan_rst.scan_rsp_len,
                                                           ESP_BLE_AD_TYPE_NAME_CMPL, &adv_name_len);

                if (adv_name != NULL && !m_is_connected) {
                    if (strncmp((char *)adv_name, TARGET_DEVICE_NAME, adv_name_len) == 0) {
                        ESP_LOGI(GATTC_TAG, "Found target device: %s", TARGET_DEVICE_NAME);
                        esp_ble_gap_stop_scanning();

                        esp_ble_gatt_creat_conn_params_t creat_conn_params = {0};
                        memcpy(creat_conn_params.remote_bda, scan_result->scan_rst.bda, ESP_BD_ADDR_LEN);
                        creat_conn_params.remote_addr_type = scan_result->scan_rst.ble_addr_type;
                        creat_conn_params.own_addr_type = BLE_ADDR_TYPE_PUBLIC;
                        creat_conn_params.is_direct = true;
                        esp_ble_gattc_enh_open(m_profile.gattc_if, &creat_conn_params);

                    }
                }
            }
            break;
        }
        case ESP_GAP_BLE_SCAN_STOP_COMPLETE_EVT:
            ESP_LOGI(GATTC_TAG, "Scan stop complete.");
            break;
        default:
            break;
    }
}


void BleClient::gattc_profile_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param) {
    esp_ble_gattc_cb_param_t *p_data = (esp_ble_gattc_cb_param_t *)param;

    switch (event) {
        case ESP_GATTC_REG_EVT: {
            esp_ble_scan_params_t ble_scan_params = {
                .scan_type = BLE_SCAN_TYPE_ACTIVE,
                .own_addr_type = BLE_ADDR_TYPE_PUBLIC,
                .scan_filter_policy = BLE_SCAN_FILTER_ALLOW_ALL,
                .scan_interval = 0x50,
                .scan_window = 0x30,
                .scan_duplicate = BLE_SCAN_DUPLICATE_DISABLE
            };
            esp_err_t scan_ret = esp_ble_gap_set_scan_params(&ble_scan_params);
            if (scan_ret) {
                ESP_LOGE(GATTC_TAG, "Set scan params error, code = %x", scan_ret);
            }
            break;
        }
        case ESP_GATTC_CONNECT_EVT:
             m_profile.conn_id = p_data->connect.conn_id;
             memcpy(m_profile.remote_bda, p_data->connect.remote_bda, sizeof(esp_bd_addr_t));
             ESP_LOGI(GATTC_TAG, "Connected to " ESP_BD_ADDR_STR, ESP_BD_ADDR_HEX(m_profile.remote_bda));
             esp_ble_gattc_send_mtu_req(gattc_if, p_data->connect.conn_id);
             break;
        case ESP_GATTC_OPEN_EVT:
            if (param->open.status != ESP_GATT_OK) {
                ESP_LOGE(GATTC_TAG, "Open GATTC failed, status %d", p_data->open.status);
            }
            break;
        case ESP_GATTC_CFG_MTU_EVT:
            if (param->cfg_mtu.status == ESP_GATT_OK) {
                ESP_LOGI(GATTC_TAG, "MTU configured to %d", param->cfg_mtu.mtu);
                esp_ble_gattc_search_service(gattc_if, m_profile.conn_id, &remote_filter_service_uuid);
            } else {
                 ESP_LOGE(GATTC_TAG, "MTU configuration failed, error code = %x", param->cfg_mtu.status);
            }
            break;
        case ESP_GATTC_SEARCH_RES_EVT: {
            if (p_data->search_res.srvc_id.uuid.len == remote_filter_service_uuid.len &&
                memcmp(p_data->search_res.srvc_id.uuid.uuid.uuid128, remote_filter_service_uuid.uuid.uuid128, ESP_UUID_LEN_128) == 0) {
                ESP_LOGI(GATTC_TAG, "Target service found");
                m_is_server_found = true;
                m_profile.service_start_handle = p_data->search_res.start_handle;
                m_profile.service_end_handle = p_data->search_res.end_handle;
            }
            break;
        }
        case ESP_GATTC_SEARCH_CMPL_EVT:
            if (p_data->search_cmpl.status != ESP_GATT_OK) {
                ESP_LOGE(GATTC_TAG, "Service search failed, status %x", p_data->search_cmpl.status);
                break;
            }
            if (m_is_server_found) {
                esp_gattc_char_elem_t *char_elem_result = NULL;
                uint16_t count = 0;
                esp_gatt_status_t status = esp_ble_gattc_get_attr_count(gattc_if, m_profile.conn_id, ESP_GATT_DB_CHARACTERISTIC,
                                                                         m_profile.service_start_handle, m_profile.service_end_handle,
                                                                         INVALID_HANDLE, &count);
                if (status != ESP_GATT_OK) {
                    ESP_LOGE(GATTC_TAG, "get_attr_count error");
                    break;
                }
                if (count > 0) {
                    char_elem_result = (esp_gattc_char_elem_t *)malloc(sizeof(esp_gattc_char_elem_t) * count);
                    if (!char_elem_result) {
                        ESP_LOGE(GATTC_TAG, "gattc no mem");
                    } else {
                        status = esp_ble_gattc_get_char_by_uuid(gattc_if, m_profile.conn_id,
                                                                m_profile.service_start_handle, m_profile.service_end_handle,
                                                                remote_filter_char_uuid, char_elem_result, &count);
                        if (status == ESP_GATT_OK && count > 0) {
                            ESP_LOGI(GATTC_TAG, "Target characteristic found, handle %d.", char_elem_result[0].char_handle);
                            m_profile.char_handle = char_elem_result[0].char_handle;
                            m_is_connected = true; // Connection fully established and ready
                            // At this point, you could register for notifications if needed.
                        } else {
                            ESP_LOGE(GATTC_TAG, "get_char_by_uuid error %d", status);
                        }
                    }
                    free(char_elem_result);
                }
            }
            break;
        case ESP_GATTC_WRITE_CHAR_EVT:
            if (p_data->write.status == ESP_GATT_OK) {
                ESP_LOGI(GATTC_TAG, "Characteristic write success.");
            } else {
                ESP_LOGE(GATTC_TAG, "Characteristic write failed, status %x", p_data->write.status);
            }
            break;
        case ESP_GATTC_DISCONNECT_EVT:
            m_is_connected = false;
            m_is_server_found = false;
            ESP_LOGI(GATTC_TAG, "Disconnected, reason 0x%02x", p_data->disconnect.reason);
            // Optionally, you can try to reconnect here by starting a new scan
            // esp_ble_gap_start_scanning(30);
            break;
        default:
            break;
    }
}